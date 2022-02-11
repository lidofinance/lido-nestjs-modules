/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { Signer, providers } from 'ethers';

export interface ContractFactoryOptions {
  address?: string;
  provider: Signer | providers.Provider;
}

export interface ContractModuleSyncOptions extends ContractFactoryOptions {}

export interface ContractModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ContractFactoryOptions>;
  inject?: any[];
}
