import { BaseProvider, Formatter } from '@ethersproject/providers';
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
import { TransactionRequest } from '@ethersproject/abstract-provider/src.ts/index';
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
import { FeeHistory, getFeeHistory } from '../ethers/fee-history';
import { TraceConfig, TraceResult } from '../interfaces/debug-traces';
import { getDebugTraceBlockByHash } from '../ethers/debug-trace-block-by-hash';

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

  public constructor(
    config: SimpleFallbackProviderConfig,
    logger: LoggerService,
  ) {
    super(config.network);
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
      return {
        network: null,
        provider,
        index,
        unreachable: false,
      };
    });
    this.activeFallbackProviderIndex = 0;
  }

  public static _formatter: Formatter | null = null;

  public static getFormatter(): Formatter {
    if (this._formatter == null) {
      this._formatter = new FormatterWithEIP1898();
    }
    return this._formatter;
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

  protected switchToNextProvider() {
    if (this.fallbackProviders.length === 1) {
      this.logger.warn(
        'Will not switch to next provider. No valid backup provider provided.',
      );
      return;
    }
    this.activeFallbackProviderIndex++;
    this.logger.log(`Switched to next provider for execution layer`);
  }

  protected isNonRetryableError(error: Error | unknown): boolean {
    return (
      !isEthersServerError(error) &&
      isErrorHasCode(error) &&
      nonRetryableErrors.includes(error.code)
    );
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
        attempt++;
        // awaiting is extremely important here
        // without it, the error will not be caught in current try-catch scope
        return await retry(() =>
          this.provider.provider.perform(method, params),
        );
      } catch (e) {
        this.lastError = e;
        // checking that error should not be retried on another provider
        if (this.isNonRetryableError(e)) {
          throw e;
        }

        this.logger.error(
          'Error while doing ETH1 RPC request. Will try to switch to another provider',
        );
        this.logger.error(e);

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
            `Fallback provider [${index}] network is different to other provider's networks`,
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

    this.fallbackProviders.forEach((fallbackProvider, index) => {
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
}
