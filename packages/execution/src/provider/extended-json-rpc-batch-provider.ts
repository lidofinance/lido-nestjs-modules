/* eslint-disable @typescript-eslint/no-explicit-any */
import { deepCopy } from '../common/deep-copy';
// import {
//   fetchJson,
// } from '@ethersproject/web';
import { JsonRpcProvider } from 'ethers';
import { Network } from 'ethers';
import { Queue } from '../common/queue';
import { FetchError } from '../error/fetch.error';
import { Injectable } from '@nestjs/common';
import pLimit, { LimitFunction } from '../common/promise-limit';
import { FormatterWithEIP1898 } from '../ethers/formatter-with-eip1898';
import { BlockTag } from '../ethers/block-tag';
import { TransactionRequest } from 'ethers';
import { MiddlewareCallback, MiddlewareService } from '@lido-nestjs/middleware';
import { FeeHistory, getFeeHistory } from '../ethers/fee-history';
import { ErrorCode } from '../error/codes/error-codes';
import {
  FetchRequest,
  Networkish,
  JsonRpcApiProviderOptions,
  Formatter,
  fetchJson,
} from 'ethers';
import { AddressLike } from 'ethers/lib.esm/address';

export type FetchJsonResponse = {
  statusCode: number;
  headers: { [header: string]: string };
};

export type Deferrable<T> = {
  [K in keyof T]: T[K] | Promise<T[K]>;
};

export type ConnectionInfo = {
  url: string;
  headers?: { [key: string]: string | number };

  user?: string;
  password?: string;

  allowInsecureAuthentication?: boolean;
  allowGzip?: boolean;

  throttleLimit?: number;
  throttleSlotInterval?: number;
  throttleCallback?: (attempt: number, url: string) => Promise<boolean>;

  timeout?: number;
};

export function defineReadOnly<T, K extends keyof T>(
  object: T,
  name: K,
  value: T[K],
): void {
  Object.defineProperty(object, name, {
    enumerable: true,
    value: value,
    writable: false,
  });
}

export interface RequestPolicy {
  jsonRpcMaxBatchSize: number;
  maxConcurrentRequests: number;
  batchAggregationWaitMs: number;
}

export interface JsonRpcRequest {
  method: string;
  params: Array<unknown>;
  id: number;
  jsonrpc: '2.0';
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface FullRequestIntent {
  request: JsonRpcRequest;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

export interface RequestIntent {
  request: FullRequestIntent['request'];
  resolve: FullRequestIntent['resolve'] | null;
  reject: FullRequestIntent['reject'] | null;
}

export type PartialRequestIntent =
  | RequestIntent
  | {
      request: RequestIntent['request'];
      resolve: null;
      reject: null;
    };

/**
 * EIP-1898 support
 * https://eips.ethereum.org/EIPS/eip-1898
 */
declare module 'ethers' {
  export interface JsonRpcProvider {
    getBalance(address: AddressLike, blockTag?: BlockTag): Promise<bigint>;
    getTransactionCount(
      address: AddressLike,
      blockTag?: BlockTag,
    ): Promise<number>;
    getCode(address: AddressLike, blockTag?: BlockTag): Promise<string>;
    getStorageAt(
      addressOrName: string | Promise<string>,
      position: bigint | Promise<bigint>,
      blockTag?: BlockTag | Promise<BlockTag>,
    ): Promise<string>;
    call(_tx: TransactionRequest): Promise<string>;
  }
}

@Injectable()
export class ExtendedJsonRpcBatchProvider extends JsonRpcProvider {
  protected _batchAggregator: NodeJS.Timer | null = null;
  protected _queue: Queue<FullRequestIntent> = new Queue<FullRequestIntent>();
  protected _requestPolicy: RequestPolicy;
  protected _concurrencyLimiter: LimitFunction;
  protected _tickCounter = 0;
  protected _fetchMiddlewareService: MiddlewareService<Promise<any>>;

  public constructor(
    url: string | FetchRequest,
    network?: Networkish,
    requestPolicy?: RequestPolicy,
    fetchMiddlewares: MiddlewareCallback<Promise<any>>[] = [],
    options?: JsonRpcApiProviderOptions,
  ) {
    super(url, network, options);
    this._requestPolicy = requestPolicy ?? {
      jsonRpcMaxBatchSize: 200,
      maxConcurrentRequests: 5,
      batchAggregationWaitMs: 10,
    };
    this._concurrencyLimiter = pLimit(
      this._requestPolicy.maxConcurrentRequests,
    );

    this._fetchMiddlewareService = new MiddlewareService<Promise<any>>({
      middlewares: fetchMiddlewares,
    });
  }

  public static _formatter: Formatter | null = null;

  public static getFormatter(): Formatter {
    if (this._formatter == null) {
      this._formatter = new FormatterWithEIP1898();
    }
    return this._formatter;
  }

  protected _batchAggregatorTick() {
    this._tickCounter++;

    if (
      this._queue.length > this._requestPolicy.jsonRpcMaxBatchSize ||
      this._tickCounter > 2
    ) {
      this._tickCounter = 0;

      // getting multiple ('jsonRpcMaxBatchSize') elements from queue at once
      // if queue size is less then 'jsonRpcMaxBatchSize' - dequeue remaining elements
      const batch = this._queue.dequeueMultiple(
        this._requestPolicy.jsonRpcMaxBatchSize,
      );

      const batchRequest = batch.map((intent) => intent.request);

      this.emit('debug', {
        action: 'requestBatch',
        request: deepCopy(batchRequest),
        provider: this,
      });

      this._concurrencyLimiter(() => {
        return this._fetchMiddlewareService.go(
          () => this.fetchJson(this.connection, JSON.stringify(batchRequest)),
          {
            provider: this,
          },
        );
      })
        .then(
          (batchResult: JsonRpcResponse[] | JsonRpcResponse) => {
            this.emit('debug', {
              action: 'response',
              request: deepCopy(batchRequest),
              response: deepCopy(batchResult),
              provider: this,
            });

            if (!Array.isArray(batchResult)) {
              const errMessage = 'Unexpected batch result.';
              const jsonRpcErrorMessage = batchResult.error?.message;
              const detailedMessage = jsonRpcErrorMessage
                ? ` Possible reason: "${jsonRpcErrorMessage}".`
                : '';

              const error = new FetchError(errMessage + detailedMessage);
              error.code = ErrorCode.UNEXPECTED_BATCH_RESULT;
              error.data = batchResult.error;

              throw error;
            }

            const resultMap = batchResult.reduce((resultMap, payload) => {
              resultMap[payload.id] = payload;
              return resultMap;
            }, {} as Record<number, JsonRpcResponse | undefined>);

            // For each batch, feed it to the correct Promise, depending
            // on whether it was a success or error
            batch.forEach((inflightRequest) => {
              const payload = resultMap[inflightRequest.request.id];
              if (!payload) {
                const error = new FetchError(
                  `Partial payload batch result. Response ${inflightRequest.request.id} not found`,
                );
                error.code = ErrorCode.PARTIAL_BATCH_RESULT;
                error.data = batchResult;
                inflightRequest.reject(error);
              } else if (payload.error) {
                const error = new FetchError(payload.error.message);
                error.code = payload.error.code;
                error.data = payload.error.data;
                inflightRequest.reject(error);
              } else {
                inflightRequest.resolve(payload.result);
              }
            });
          },
          (error: Error) => {
            this.emit('debug', {
              action: 'response',
              error: error,
              request: deepCopy(batchRequest),
              provider: this,
            });

            batch.forEach((inflightRequest) => {
              inflightRequest.reject(error);
            });
          },
        )
        .catch((error: Error) => {
          // catch errors happening in the 'then' callback
          this.emit('debug', {
            action: 'response',
            error: error,
            request: deepCopy(batchRequest),
            provider: this,
          });

          batch.forEach((inflightRequest) => {
            inflightRequest.reject(error);
          });
        });
    }

    this._batchAggregator && clearTimeout(this._batchAggregator);
    this._batchAggregator = null;

    // if the queue is not empty we should continue 'ticking'
    // every 'batchAggregationWaitMs' time, until the queue is empty
    if (this._queue.length > 0) {
      this._startBatchAggregator();
    }
  }

  protected _startBatchAggregator() {
    if (!this._batchAggregator) {
      // schedule batch for next event loop + short duration (macrotask)
      this._batchAggregator = setTimeout(
        this._batchAggregatorTick.bind(this),
        this._requestPolicy.batchAggregationWaitMs,
      );
    }
  }

  public async getFeeHistory(
    blockCount: number,
    newestBlock?: string | null | number,
    rewardPercentiles?: number[],
  ): Promise<FeeHistory> {
    return getFeeHistory.call(this, blockCount, newestBlock, rewardPercentiles);
  }

  public prepareRequest(method: string, params: any): [string, Array<any>] {
    switch (method) {
      case 'getFeeHistory':
        return [
          'eth_feeHistory',
          [params.blockCount, params.newestBlock, params.rewardPercentiles],
        ];
      default:
        return super.prepareRequest(method, params);
    }
  }

  public use(callback: MiddlewareCallback<Promise<any>>) {
    this._fetchMiddlewareService.use(callback);
  }

  public send(method: string, params: Array<unknown>): Promise<unknown> {
    const request: JsonRpcRequest = {
      method: method,
      params: params,
      id: this._nextId++,
      jsonrpc: '2.0',
    };

    const currentRequest: RequestIntent = {
      request,
      reject: null,
      resolve: null,
    };

    const promise = new Promise((resolve, reject) => {
      currentRequest.resolve = resolve;
      currentRequest.reject = reject;
    });

    this._queue.enqueue(<FullRequestIntent>currentRequest);

    this._startBatchAggregator();

    return promise;
  }

  public async detectNetwork(): Promise<Network> {
    let network = this._network;

    if (network == null) {
      network = await super._detectNetwork();

      // If still not set, set it
      if (this._network == null) {
        // A static network does not support "any"
        defineReadOnly(this, '_network', network);

        await this.emit('network', network, null);
      }
    }

    return network;
  }

  protected async fetchJson(
    connection: string | ConnectionInfo,
    json?: string,
    processFunc?: (value: any, response: FetchJsonResponse) => any,
  ) {
    return await fetchJson(connection, json, processFunc);
  }
}
