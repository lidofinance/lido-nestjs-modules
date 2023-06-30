/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { Signer as SignerType, Provider as ProviderType } from 'ethers';

export interface ContractFactoryOptions {
  address?: string;
  provider?: SignerType | ProviderType;
}

export interface ContractModuleSyncOptions extends ContractFactoryOptions {}

export interface ContractModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ContractFactoryOptions>;
  inject?: any[];
}
