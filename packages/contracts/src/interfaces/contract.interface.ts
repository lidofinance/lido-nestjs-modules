/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';

export interface ContractFactoryOptions {
  address?: string;
  provider?: Signer | Provider;
}

export interface ContractModuleSyncOptions extends ContractFactoryOptions {}

export interface ContractModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ContractFactoryOptions>;
  inject?: any[];
}
