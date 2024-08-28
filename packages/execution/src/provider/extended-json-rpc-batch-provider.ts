/* eslint-disable @typescript-eslint/no-explicit-any */
import { deepCopy, Deferrable } from '@ethersproject/properties';
import {
  ConnectionInfo,
  fetchJson,
  FetchJsonResponse,
} from '@ethersproject/web';
import { Formatter, JsonRpcProvider } from '@ethersproject/providers';
import { Network, Networkish } from '@ethersproject/networks';
import { defineReadOnly } from '@ethersproject/properties';
import { Queue } from '../common/queue';
import { FetchError } from '../error/fetch.error';
import { Injectable } from '@nestjs/common';
import pLimit, { LimitFunction } from '../common/promise-limit';
import { FormatterWithEIP1898 } from '../ethers/formatter-with-eip1898';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { BlockTag } from '../ethers/block-tag';
import { TransactionRequest } from '@ethersproject/abstract-provider/src.ts/index';
import { MiddlewareCallback, MiddlewareService } from '@lido-nestjs/middleware';
import { FeeHistory, getFeeHistory } from '../ethers/fee-history';
import { ErrorCode } from '../error/codes/error-codes';
import { TraceConfig, TraceResult } from '../interfaces/debug-traces';
import { getDebugTraceBlockByHash } from '../ethers/debug-trace-block-by-hash';
import { getConnectionFQDN } from '../common/networks';
import { EventEmitter } from 'events';
import {
  ProviderEvents,
  ProviderRequestBatchedEvent,
  ProviderResponseBatchedErrorEvent,
  ProviderResponseBatchedEvent,
} from '../events';

// this will help with autocomplete
export interface ExtendedJsonRpcBatchProviderEventEmitter
  extends NodeJS.EventEmitter {
  on(eventName: 'rpc', listener: (event: ProviderEvents) => void): this;
  once(eventName: 'rpc', listener: (event: ProviderEvents) => void): this;
  addListener(
    eventName: 'rpc',
    listener: (event: ProviderEvents) => void,
  ): this;
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
declare module '@ethersproject/providers' {
  export interface JsonRpcProvider {
    getBalance(
      addressOrName: string | Promise<string>,
      blockTag?: BlockTag | Promise<BlockTag>,
    ): Promise<BigNumber>;
    getTransactionCount(
      addressOrName: string | Promise<string>,
      blockTag?: BlockTag | Promise<BlockTag>,
    ): Promise<number>;
    getCode(
      addressOrName: string | Promise<string>,
      blockTag?: BlockTag | Promise<BlockTag>,
    ): Promise<string>;
    getStorageAt(
      addressOrName: string | Promise<string>,
      position: BigNumberish | Promise<BigNumberish>,
      blockTag?: BlockTag | Promise<BlockTag>,
    ): Promise<string>;
    call(
      transaction: Deferrable<TransactionRequest>,
      blockTag?: BlockTag | Promise<BlockTag>,
    ): Promise<string>;
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
  protected _domain: string;
  protected _eventEmitter: ExtendedJsonRpcBatchProviderEventEmitter;

  public constructor(
    url: ConnectionInfo | string,
    network?: Networkish,
    requestPolicy?: RequestPolicy,
    fetchMiddlewares: MiddlewareCallback<Promise<any>>[] = [],
  ) {
    super(url, network);
    this._eventEmitter = new EventEmitter();
    this._domain = getConnectionFQDN(url);
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

      const event: ProviderRequestBatchedEvent = {
        action: 'provider:request-batched',
        request: deepCopy(batchRequest),
        provider: this,
        domain: this._domain,
      };
      this._eventEmitter.emit('rpc', event);

      this._concurrencyLimiter(() => {
        return this._fetchMiddlewareService.go(
          () => this.fetchJson(this.connection, JSON.stringify(batchRequest)),
          {
            provider: this,
            domain: this._domain,
          },
        );
      })
        .then(
          (batchResult: JsonRpcResponse[] | JsonRpcResponse) => {
            const event: ProviderResponseBatchedEvent = {
              action: 'provider:response-batched',
              request: deepCopy(batchRequest),
              response: deepCopy(batchResult),
              provider: this,
              domain: this._domain,
            };
            this._eventEmitter.emit('rpc', event);

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
            const event: ProviderResponseBatchedErrorEvent = {
              action: 'provider:response-batched:error',
              error: error,
              request: deepCopy(batchRequest),
              provider: this,
              domain: this._domain,
            };
            this._eventEmitter.emit('rpc', event);

            batch.forEach((inflightRequest) => {
              inflightRequest.reject(error);
            });
          },
        )
        .catch((error: Error) => {
          // catch errors happening in the 'then' callback
          const event: ProviderResponseBatchedErrorEvent = {
            action: 'provider:response-batched:error',
            error: error,
            request: deepCopy(batchRequest),
            provider: this,
            domain: this._domain,
          };
          this._eventEmitter.emit('rpc', event);

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

  public async getDebugTraceBlockByHash(
    blockHash: string,
    traceConfig: TraceConfig,
  ): Promise<TraceResult[]> {
    return getDebugTraceBlockByHash.call(this, blockHash, traceConfig);
  }

  public prepareRequest(method: string, params: any): [string, Array<any>] {
    switch (method) {
      case 'getFeeHistory':
        return [
          'eth_feeHistory',
          [params.blockCount, params.newestBlock, params.rewardPercentiles],
        ];
      case 'getDebugTraceBlockByHash':
        return [
          'debug_traceBlockByHash',
          [params.blockHash, params.traceConfig],
        ];
      default:
        return super.prepareRequest(method, params);
    }
  }

  public use(callback: MiddlewareCallback<Promise<any>>) {
    this._fetchMiddlewareService.use(callback);
  }

  public get domain(): string {
    return this._domain;
  }

  public get eventEmitter() {
    return this._eventEmitter;
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
    let network = this.network;

    if (network == null) {
      network = await super.detectNetwork();

      // If still not set, set it
      if (this._network == null) {
        // A static network does not support "any"
        defineReadOnly(this, '_network', network);

        this.emit('network', network, null);
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
