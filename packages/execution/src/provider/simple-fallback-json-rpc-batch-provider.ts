import { BaseProvider } from '@ethersproject/providers';
import { SimpleFallbackProviderConfig } from '../interfaces/simple-fallback-provider-config';
import { ExtendedJsonRpcBatchProvider } from './extended-json-rpc-batch-provider';
import { Network } from '@ethersproject/networks';
import { LoggerService } from '@nestjs/common';
import { retrier } from '../common/retrier';
import { FallbackProvider } from '../interfaces/fallback-provider';

export class SimpleFallbackJsonRpcBatchProvider extends BaseProvider {
  protected config: SimpleFallbackProviderConfig;
  protected logger: LoggerService;
  protected fallbackProviders: [FallbackProvider];
  protected activeFallbackProviderIndex: number;

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
      ...config,
    };
    this.logger = logger;

    const urls = config.urls.filter((url) => {
      if (typeof url === 'string' && !url) {
        return false;
      }

      if (typeof url === 'object' && url !== null && !url.url) {
        return false;
      }

      return true;
    });

    if (urls.length < 1) {
      throw new Error('No valid URLs or Connections were provided');
    }

    this.fallbackProviders = <[FallbackProvider]>urls.map((url) => {
      const provider = new ExtendedJsonRpcBatchProvider(
        url,
        undefined,
        config.requestPolicy,
      );
      return {
        valid: false,
        network: null,
        provider,
      };
    });
    this.activeFallbackProviderIndex = 0;
  }

  protected get provider(): FallbackProvider {
    if (this.activeFallbackProviderIndex > this.fallbackProviders.length - 1) {
      this.activeFallbackProviderIndex = 0;
    }

    let variant = this.fallbackProviders[this.activeFallbackProviderIndex];
    let attempt = 0;

    while (!variant.valid || attempt < this.fallbackProviders.length) {
      variant = this.fallbackProviders[this.activeFallbackProviderIndex];
      attempt++;
    }

    if (!variant.valid) {
      // this likely will never happen
      throw new Error('No valid providers remaining. Exiting');
    }

    return variant;
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
    );

    let attempt = 0;

    // will perform maximum `this.config.maxRetries` retries for fetching data with single provider
    // after that will switch to next provider
    // maximum number of switching is limited to total fallback provider count
    while (attempt < this.fallbackProviders.length) {
      try {
        attempt++;
        // awaiting is extremely important here
        // without it the error will not be caught in current try-catch scope
        return await retry(() =>
          this.provider.provider.perform(method, params),
        );
      } catch (e) {
        this.logger.error(
          'Error while doing ETH1 RPC request. Will try to switch to another provider',
        );
        this.logger.error(e);
        this.switchToNextProvider();
      }
    }

    throw new Error('All attempts failed');
  }

  public async detectNetwork(): Promise<Network> {
    const results = await Promise.allSettled(
      this.fallbackProviders.map((c) => c.provider.getNetwork()),
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        this.fallbackProviders[i].valid = true;
        this.fallbackProviders[i].network = result.value;
      } else {
        this.fallbackProviders[i].valid = false;
        this.fallbackProviders[i].network = null;
      }
    });

    let previousNetwork: Network | null = null;

    this.fallbackProviders.forEach((variant) => {
      if (!variant.network) {
        return;
      }

      if (previousNetwork) {
        // Make sure the network matches the previous networks
        if (
          !(
            previousNetwork.name === variant.network.name &&
            previousNetwork.chainId === variant.network.chainId &&
            (previousNetwork.ensAddress === variant.network.ensAddress ||
              (previousNetwork.ensAddress == null &&
                variant.network.ensAddress == null))
          )
        ) {
          throw new Error('Provider networks mismatch');
        }
      } else {
        previousNetwork = variant.network;
      }
    });

    if (!previousNetwork) {
      throw new Error('No valid networks found');
    }

    return previousNetwork;
  }
}
