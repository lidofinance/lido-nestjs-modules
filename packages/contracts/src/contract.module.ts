import { DynamicModule } from '@nestjs/common';
import { Signer, providers } from 'ethers';
import {
  ContractFactoryOptions,
  ContractModuleAsyncOptions,
  ContractModuleSyncOptions,
} from './interfaces/contract.interface';
import { ContractFactory } from './interfaces/factory.interface';

export class ContractModule {
  static module = ContractModule;
  static contractFactory: ContractFactory;
  static contractToken: symbol;
  static defaultAddresses: Record<number, string>;

  static forRoot(options: ContractModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forRootAsync(options: ContractModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options: ContractModuleSyncOptions): DynamicModule {
    return {
      module: this.module,
      providers: [
        {
          provide: this.contractToken,
          useFactory: async () => await this.factory(options),
        },
      ],
    };
  }

  public static forFeatureAsync(
    options: ContractModuleAsyncOptions,
  ): DynamicModule {
    return {
      imports: options.imports,
      module: this.module,
      providers: [
        {
          provide: this.contractToken,
          useFactory: async (...args) => {
            const config = await options.useFactory(...args);
            return this.factory(config);
          },
          inject: options.inject,
        },
      ],
    };
  }

  protected static async factory(options: ContractFactoryOptions) {
    const address = await this.extractAddress(
      options.address,
      options.provider,
      this.defaultAddresses,
    );

    return this.contractFactory.connect(address, options.provider);
  }

  protected static async detectChainId(
    providerOrSigner: Signer | providers.Provider,
  ): Promise<number> {
    if (providerOrSigner instanceof providers.Provider) {
      const network = await providerOrSigner.getNetwork();
      return network.chainId;
    }

    if (providerOrSigner instanceof Signer && providerOrSigner.provider) {
      const network = await providerOrSigner.provider.getNetwork();
      return network.chainId;
    }

    throw new Error('Provider or signer is not supported');
  }

  protected static async extractAddress(
    address: string | undefined,
    providerOrSigner: Signer | providers.Provider,
    addressMap: Record<number, string>,
  ): Promise<string> {
    if (address) return address;

    const chainId = await this.detectChainId(providerOrSigner);
    if (addressMap[chainId]) return addressMap[chainId];

    throw new Error('ChainId is not supported');
  }
}
