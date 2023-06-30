import { DynamicModule } from '@nestjs/common';
import { Provider as ProviderType, Signer as SignerType } from 'ethers';
import { AbstractProvider as Provider } from 'ethers/src.ts/providers/abstract-provider';
import { AbstractSigner as Signer } from 'ethers/src.ts/providers/abstract-signer';
import {
  ContractFactoryOptions,
  ContractModuleAsyncOptions,
  ContractModuleSyncOptions,
} from './interfaces/contract.interface';
import { ContractFactory } from './interfaces/factory.interface';
import { ModuleRef } from '@nestjs/core';

export class ContractModule {
  static module = ContractModule;
  static contractFactory: ContractFactory;
  static contractToken: symbol;
  static defaultAddresses: Record<number, string>;

  static forRoot(options?: ContractModuleSyncOptions): DynamicModule {
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

  static forFeature(options?: ContractModuleSyncOptions): DynamicModule {
    return {
      module: this.module,
      providers: [
        {
          provide: this.contractToken,
          useFactory: async (moduleRef: ModuleRef) => {
            return await this.factory(moduleRef, options);
          },
          inject: [ModuleRef],
        },
      ],
      exports: [this.contractToken],
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
          useFactory: async (moduleRef: ModuleRef, ...args) => {
            const config = await options.useFactory(...args);
            return this.factory(moduleRef, config);
          },
          inject: [ModuleRef, ...(options.inject ?? [])],
        },
      ],
      exports: [this.contractToken],
    };
  }

  protected static async factory(
    moduleRef: ModuleRef,
    options?: ContractFactoryOptions,
  ) {
    const getFromScope = (): ProviderType =>
      moduleRef.get(Provider, { strict: false });

    const getFromOptions = () => options?.provider;
    const provider = getFromOptions() || getFromScope();

    const address = await this.extractAddress(
      options?.address,
      provider,
      this.defaultAddresses,
    );

    return this.contractFactory.connect(address, provider);
  }

  protected static async detectChainId(
    providerOrSigner: SignerType | ProviderType,
  ): Promise<number> {
    if (providerOrSigner instanceof Provider) {
      const provider: Provider = providerOrSigner;
      const network = await provider.getNetwork();
      return Number(network.chainId);
    }

    if (providerOrSigner instanceof Signer) {
      const signer: Signer = providerOrSigner;

      if (!signer.provider) {
        throw new Error('Signer does not have provider supplied');
      }

      const network = await signer.provider.getNetwork();
      return Number(network.chainId);
    }

    throw new Error('Provider or signer is not supported');
  }

  protected static async extractAddress(
    address: string | undefined,
    providerOrSigner: SignerType | ProviderType,
    addressMap: Record<number, string>,
  ): Promise<string> {
    if (address) return address;

    const chainId = await this.detectChainId(providerOrSigner);
    if (addressMap[chainId]) return addressMap[chainId];

    throw new Error('ChainId is not supported');
  }
}
