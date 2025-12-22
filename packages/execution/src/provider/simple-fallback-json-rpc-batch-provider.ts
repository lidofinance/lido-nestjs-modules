import {
  BaseProvider,
  Formatter,
  TransactionRequest,
} from '@ethersproject/providers';
import { CallOverrides as CallOverridesSource } from '@ethersproject/contracts';
import { SimpleFallbackProviderConfig } from '../interfaces/simple-fallback-provider-config';
import { ExtendedJsonRpcBatchProvider } from './extended-json-rpc-batch-provider';
import { Network } from '@ethersproject/networks';
import { Injectable, LoggerService } from '@nestjs/common';
import { retrier } from '../common/retrier';
import { FallbackProvider } from '../interfaces/fallback-provider';
import { BlockTag } from '../ethers/block-tag';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Deferrable } from '@ethersproject/properties';
import { FormatterWithEIP1898 } from '../ethers/formatter-with-eip1898';
import {
  getNetworkChain,
  networksChainsEqual,
  networksEqual,
} from '../common/networks';
import { EventType, Listener } from '@ethersproject/abstract-provider';
import { NoNewBlocksWhilePollingError } from '../error/no-new-blocks-while-polling.error';
import {
  isErrorHasCode,
  isEthersServerError,
  nonRetryableErrors,
} from '../common/errors';
import { AllProvidersFailedError } from '../error/all-providers-failed.error';
import { RequestTimeoutError } from '../error/request-timeout.error';
import { FeeHistory, getFeeHistory } from '../ethers/fee-history';
import { TraceConfig, TraceResult } from '../interfaces/debug-traces';
import { getDebugTraceBlockByHash } from '../ethers/debug-trace-block-by-hash';
import { EventEmitter } from 'events';
import {
  FallbackProviderEvents,
  FallbackProviderRequestEvent,
  FallbackProviderRequestFailedAllEvent,
  FallbackProviderRequestNonRetryableErrorEvent,
} from '../events';

/**
 * EIP-1898 support
 * https://eips.ethereum.org/EIPS/eip-1898
 */
declare module '@ethersproject/providers' {
  export interface BaseProvider {
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

  export interface CallOverrides extends Omit<CallOverridesSource, 'blockTag'> {
    blockTag?: BlockTag;
  }
}

// this will help with autocomplete
export interface SimpleFallbackJsonRpcBatchProviderEventEmitter
  extends NodeJS.EventEmitter {
  on(eventName: 'rpc', listener: (event: FallbackProviderEvents) => void): this;
  once(
    eventName: 'rpc',
    listener: (event: FallbackProviderEvents) => void,
  ): this;
  addListener(
    eventName: 'rpc',
    listener: (event: FallbackProviderEvents) => void,
  ): this;
}

@Injectable()
export class SimpleFallbackJsonRpcBatchProvider extends BaseProvider {
  protected config: SimpleFallbackProviderConfig;
  protected logger: LoggerService;
  protected fallbackProviders: [FallbackProvider];
  protected activeFallbackProviderIndex: number;
  protected detectNetworkFirstRun = true;
  protected resetTimer: ReturnType<typeof setTimeout> | null = null;
  // it is crucial not to mix these two errors
  protected lastPerformError: Error | null | unknown = null; // last error for 'perform' operations, is batch-oriented
  protected lastError: Error | null | unknown = null; // last error for whole provider
  protected _eventEmitter: SimpleFallbackJsonRpcBatchProviderEventEmitter;

  public constructor(
    config: SimpleFallbackProviderConfig,
    logger: LoggerService,
  ) {
    super(config.network);
    this._eventEmitter = new EventEmitter();
    this.config = {
      maxRetries: 3,
      minBackoffMs: 500,
      maxBackoffMs: 5000,
      logRetries: true,
      resetIntervalMs: 10000,
      maxTimeWithoutNewBlocksMs: 60000,
      ...config,
    };
    this.logger = logger;

    const conns = config.urls.filter((url) => {
      if (!url) {
        return false;
      }

      if (typeof url === 'object' && !url.url) {
        return false;
      }

      return true;
    });

    if (conns.length < 1) {
      throw new Error('No valid URLs or Connections were provided');
    }

    this.fallbackProviders = <[FallbackProvider]>conns.map((conn, index) => {
      const provider = new ExtendedJsonRpcBatchProvider(
        conn,
        undefined,
        config.requestPolicy,
        config.fetchMiddlewares ?? [],
      );

      // re-emitting events from fallback-providers
      provider.eventEmitter.on('rpc', (event) => {
        this._eventEmitter.emit('rpc', event);
      });

      return {
        network: null,
        provider,
        index,
        unreachable: false,
      };
    });
    this.activeFallbackProviderIndex = 0;

    // Log initialization info
    const configInfo = {
      providers: conns.length,
      network: this.config.network,
      requestPolicy: this.config.requestPolicy,
      maxRetries: this.config.maxRetries,
      minBackoffMs: this.config.minBackoffMs,
      maxBackoffMs: this.config.maxBackoffMs,
      logRetries: this.config.logRetries,
      resetIntervalMs: this.config.resetIntervalMs,
      fetchMiddlewares: this.config.fetchMiddlewares?.length || 0,
      maxTimeWithoutNewBlocksMs: this.config.maxTimeWithoutNewBlocksMs,
      requestTimeoutMs: this.config.requestTimeoutMs || 'disabled',
      instanceLabel: this.config.instanceLabel || 'none',
    };
    this.logger.log(
      this.formatLog(
        `Initialized SimpleFallbackJsonRpcBatchProvider: ${JSON.stringify(
          configInfo,
        )}`,
      ),
    );
  }

  public static _formatter: Formatter | null = null;

  public static getFormatter(): Formatter {
    if (this._formatter == null) {
      this._formatter = new FormatterWithEIP1898();
    }
    return this._formatter;
  }

  protected formatLog(message: string, providerIndex?: number): string {
    const parts: string[] = [];

    if (this.config.instanceLabel) {
      parts.push(`[${this.config.instanceLabel}]`);
    }

    if (providerIndex !== undefined) {
      parts.push(`[provider:${providerIndex}]`);
    }

    if (parts.length > 0) {
      return `${parts.join('')} ${message}`;
    }

    return message;
  }

  on(eventName: EventType, listener: Listener): this {
    let dieTimer: NodeJS.Timeout | null = null;

    const startDieTimer = (latestObservedBlockNumber: number) => {
      if (dieTimer) clearTimeout(dieTimer);

      dieTimer = setTimeout(async () => {
        const error = new NoNewBlocksWhilePollingError(
          'No new blocks for a long time while polling',
          latestObservedBlockNumber,
        );
        this.emit('error', error);
      }, this.config.maxTimeWithoutNewBlocksMs);
    };

    if (eventName === 'block') {
      startDieTimer(-1);

      return super.on(eventName, function (this: unknown, ...args) {
        startDieTimer(args[0]);
        return listener.apply(this, args);
      });
    }

    return super.on(eventName, listener);
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
    traceConfig: Partial<TraceConfig>,
  ): Promise<TraceResult[]> {
    return getDebugTraceBlockByHash.call(this, blockHash, traceConfig);
  }

  protected get provider(): FallbackProvider {
    if (this.activeFallbackProviderIndex > this.fallbackProviders.length - 1) {
      this.activeFallbackProviderIndex = 0;
    }

    let fallbackProvider =
      this.fallbackProviders[this.activeFallbackProviderIndex];
    let attempt = 0;

    const isValid = (provider: FallbackProvider): boolean =>
      provider.network !== null &&
      provider.network.chainId === getNetworkChain(this.config.network);

    while (
      !isValid(fallbackProvider) &&
      attempt < this.fallbackProviders.length
    ) {
      fallbackProvider =
        this.fallbackProviders[this.activeFallbackProviderIndex];

      // skipping providers with unreachable endpoints or networks
      // that are not equal to predefined network (from config)
      if (!isValid(fallbackProvider)) {
        this.activeFallbackProviderIndex++;
      }

      attempt++;
    }

    return fallbackProvider;
  }

  public switchToNextProvider(): boolean {
    if (this.fallbackProviders.length === 1) {
      this.logger.warn(
        this.formatLog(
          'Will not switch to next provider. No valid backup provider provided.',
        ),
      );
      return false;
    }
    const oldIndex = this.activeFallbackProviderIndex;
    this.activeFallbackProviderIndex =
      (this.activeFallbackProviderIndex + 1) % this.fallbackProviders.length;
    this.logger.log(
      this.formatLog(
        `Switched provider: [${oldIndex}] -> [${this.activeFallbackProviderIndex}] (total: ${this.fallbackProviders.length})`,
      ),
    );
    return true;
  }

  protected isNonRetryableError(error: Error | unknown): boolean {
    return (
      !isEthersServerError(error) &&
      isErrorHasCode(error) &&
      nonRetryableErrors.includes(error.code)
    );
  }

  protected withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(
            new RequestTimeoutError(
              `Request timeout after ${timeoutMs}ms`,
              timeoutMs,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  }

  public async perform(
    method: string,
    params: { [name: string]: unknown },
  ): Promise<unknown> {
    const retry = retrier(
      this.logger,
      this.config.maxRetries,
      this.config.minBackoffMs,
      this.config.maxBackoffMs,
      this.config.logRetries,
      (e) => this.isNonRetryableError(e),
    );

    let attempt = 0;

    // will perform maximum `this.config.maxRetries` retries for fetching data with single provider
    // after failure will switch to next provider
    // maximum number of switching is limited to total fallback provider count
    while (attempt < this.fallbackProviders.length) {
      try {
        let performRetryAttempt = 0;
        attempt++;

        // Log which provider we're attempting to use
        this.logger.log(
          this.formatLog(
            `Attempting request (attempt ${attempt}/${this.fallbackProviders.length})`,
            this.activeFallbackProviderIndex,
          ),
        );

        // awaiting is extremely important here
        // without it, the error will not be caught in current try-catch scope
        const result = await retry(() => {
          const provider = this.provider;

          const event: FallbackProviderRequestEvent = {
            action: 'fallback-provider:request',
            provider: this,
            activeFallbackProviderIndex: this.activeFallbackProviderIndex,
            fallbackProvidersCount: this.fallbackProviders.length,
            domain: provider.provider.domain,
            retryAttempt: performRetryAttempt,
          };
          this._eventEmitter.emit('rpc', event);

          performRetryAttempt++;
          const performPromise = provider.provider.perform(method, params);

          // Apply timeout if configured
          if (this.config.requestTimeoutMs) {
            return this.withTimeout(
              performPromise,
              this.config.requestTimeoutMs,
            );
          }

          return performPromise;
        });

        // Log successful request
        this.logger.log(
          this.formatLog(
            `Request successful after ${performRetryAttempt} retry attempt(s)`,
            this.activeFallbackProviderIndex,
          ),
        );

        return result;
      } catch (e) {
        this.lastError = e;

        // checking that error should not be retried on another provider
        if (this.isNonRetryableError(e)) {
          const event: FallbackProviderRequestNonRetryableErrorEvent = {
            action: 'fallback-provider:request:non-retryable-error',
            provider: this,
            error: e,
          };
          this._eventEmitter.emit('rpc', event);
          // Log context (label + provider index) synchronously before error object
          // to ensure proper ordering in async logging systems
          this.logger.error(
            this.formatLog(
              `Non-retryable error occurred`,
              this.activeFallbackProviderIndex,
            ),
          );
          this.logger.error(e);
          throw e;
        }

        // Log context (label + provider index) synchronously before error object
        // to ensure proper ordering in async logging systems
        if (e instanceof RequestTimeoutError) {
          this.logger.error(
            this.formatLog(
              `Request timeout after ${e.timeoutMs}ms. Will switch to next provider.`,
              this.activeFallbackProviderIndex,
            ),
          );
          this.logger.error(e);
        } else {
          this.logger.error(
            this.formatLog(
              `Error occurred. Will switch to next provider.`,
              this.activeFallbackProviderIndex,
            ),
          );
          this.logger.error(e);
        }

        // This check is needed to avoid multiple `switchToNextProvider` calls when doing one JSON-RPC batch.
        // This can happen when multiple N calls to `perform` are batched in one JSON-RPC request and
        // that request fails and throws `Error`. This `Error` is bubbled N times to corresponding `perform` calls.
        // Without the following check, each `perform` call from batch catches `Error` and switches to the next provider,
        // so during one batch multiple switching to next provider can occur, which is not needed.
        if (this.lastPerformError != e) {
          this.switchToNextProvider();
          this.lastPerformError = e;
        }
      }
    }

    const allProvidersFailedError = new AllProvidersFailedError(
      'All attempts to do ETH1 RPC request failed',
    );
    allProvidersFailedError.cause = this.lastError;

    const event: FallbackProviderRequestFailedAllEvent = {
      action: 'fallback-provider:request:failed:all',
      provider: this,
      error: allProvidersFailedError,
    };
    this._eventEmitter.emit('rpc', event);

    throw allProvidersFailedError;
  }

  public async detectNetwork(): Promise<Network> {
    const results = await Promise.allSettled(
      this.fallbackProviders
        .filter((c) => !c.unreachable)
        .map((c) => c.provider.getNetwork()),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.fallbackProviders[index].network = result.value;
        this.fallbackProviders[index].unreachable = false;
      } else {
        this.fallbackProviders[index].network = null;
        this.fallbackProviders[index].unreachable = true;
        this.lastError = result.reason;
      }
    });

    let previousNetwork: Network | null = null;

    this.fallbackProviders.forEach((fallbackProvider, index) => {
      if (!fallbackProvider.network) {
        return;
      }

      if (!networksChainsEqual(fallbackProvider.network, this.config.network)) {
        if (this.detectNetworkFirstRun) {
          throw new Error(
            `Fallback provider [${index}] network chainId ` +
              `[${fallbackProvider.network.chainId}] is different to network ` +
              `chainId from config [${getNetworkChain(this.config.network)}]`,
          );
        }
        // TODO add logs here
        // skipping network with bad chainId
        return;
      }

      if (previousNetwork) {
        // Make sure the fallbackProvider network matches the previous network
        if (!this.networksEqual(previousNetwork, fallbackProvider.network)) {
          if (this.detectNetworkFirstRun) {
            throw new Error(
              `Fallback provider [${index}] network is different to other provider's networks`,
            );
          }
          this.logger.warn(
            this.formatLog(
              `Fallback provider [${index}] network is different to other provider's networks`,
            ),
          );
        }
      } else {
        previousNetwork = fallbackProvider.network;
      }
    });

    if (!previousNetwork) {
      const error = new AllProvidersFailedError(
        'All fallback endpoints are unreachable or all fallback networks differ between each other',
      );

      error.cause = this.lastError;
      throw error;
    }

    if (this.detectNetworkFirstRun) {
      this.detectNetworkFirstRun = false;
    }

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.resetFallbacks();
    }, this.config.resetIntervalMs || 10000);

    return previousNetwork;
  }

  protected resetFallbacks() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.fallbackProviders.forEach((_, index) => {
      if (!this.fallbackProviders[index].network?.chainId) {
        this.fallbackProviders[index].unreachable = false;
      }
    });

    this.activeFallbackProviderIndex = 0;
  }

  protected networksEqual(networkA: Network, networkB: Network): boolean {
    return networksEqual(networkA, networkB);
  }

  public get activeProviderIndex() {
    return this.activeFallbackProviderIndex;
  }

  public get eventEmitter() {
    return this._eventEmitter;
  }
}
