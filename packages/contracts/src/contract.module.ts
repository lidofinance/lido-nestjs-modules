import { DynamicModule } from '@nestjs/common';
import { Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
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
    const getFromScope = () => moduleRef.get(Provider, { strict: false });
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
    providerOrSigner: Signer | Provider,
  ): Promise<number> {
    if (Provider.isProvider(providerOrSigner)) {
      const network = await providerOrSigner.getNetwork();
      return network.chainId;
    }

    if (Signer.isSigner(providerOrSigner) && providerOrSigner.provider) {
      const network = await providerOrSigner.provider.getNetwork();
      return network.chainId;
    }

    throw new Error('Provider or signer is not supported');
  }

  protected static async extractAddress(
    address: string | undefined,
    providerOrSigner: Signer | Provider,
    addressMap: Record<number, string>,
  ): Promise<string> {
    if (address) return address;

    const chainId = await this.detectChainId(providerOrSigner);
    if (addressMap[chainId]) return addressMap[chainId];
    const wrongChainIdErrorMessage = 'ChainId is not supported';

    throw new Error(wrongChainIdErrorMessage);
  }
}
