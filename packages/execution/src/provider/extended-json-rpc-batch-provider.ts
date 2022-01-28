/* eslint-disable @typescript-eslint/no-explicit-any */

import { deepCopy } from '@ethersproject/properties';
import { ConnectionInfo, fetchJson } from '@ethersproject/web';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Network, Networkish } from '@ethersproject/networks';
import { defineReadOnly } from '@ethersproject/properties';
import { Queue } from '../common/queue';
import { FetchError } from '../error/fetch.error';
import { Injectable } from '@nestjs/common';
import { FetchJsonResponse } from '@ethersproject/web/src.ts/index';
import pLimit, { LimitFunction } from '../common/promise-limit';

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

export interface RequestIntent {
  request: JsonRpcRequest;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

@Injectable()
export class ExtendedJsonRpcBatchProvider extends JsonRpcProvider {
  protected _batchAggregator: NodeJS.Timer | null = null;
  protected _queue: Queue<RequestIntent> = new Queue<RequestIntent>();
  protected _requestPolicy: RequestPolicy;
  protected _concurrencyLimiter: LimitFunction;
  protected _tickCounter = 0;

  public constructor(
    url?: ConnectionInfo | string,
    network?: Networkish,
    requestPolicy?: RequestPolicy,
  ) {
    super(url, network); // TODO multiple urls with fallback
    this._requestPolicy = requestPolicy ?? {
      jsonRpcMaxBatchSize: 200,
      maxConcurrentRequests: 5,
      batchAggregationWaitMs: 10,
    };
    this._concurrencyLimiter = pLimit(
      this._requestPolicy.maxConcurrentRequests,
    );
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

      this._concurrencyLimiter(() =>
        this.fetchJson(this.connection, JSON.stringify(batchRequest)),
      ).then(
        (batchResult) => {
          this.emit('debug', {
            action: 'response',
            request: deepCopy(batchRequest),
            response: deepCopy(batchResult),
            provider: this,
          });

          // For each batch, feed it to the correct Promise, depending
          // on whether it was a success or error
          batch.forEach((inflightRequest, index) => {
            const payload = batchResult[index]; // TODO check json-rpc ids
            if (payload.error) {
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
      );
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

  public send(method: string, params: Array<unknown>): Promise<unknown> {
    const request: JsonRpcRequest = {
      method: method,
      params: params,
      id: this._nextId++,
      jsonrpc: '2.0',
    };

    const currentRequest: RequestIntent = {
      request,
      resolve: () => void 0,
      reject: () => void 0,
    };

    const promise = new Promise((resolve, reject) => {
      currentRequest.resolve = resolve;
      currentRequest.reject = reject;
    });

    this._queue.enqueue(currentRequest);

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
    const result = await fetchJson(connection, json, processFunc);

    console.log(json, JSON.stringify(result));

    return result;
  }
}