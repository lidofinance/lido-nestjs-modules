/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { Registry } from '@lido-nestjs/contracts';

export interface RegistryFetchOptions {
  registryContract?: Registry;
}

export interface RegistryFetchModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    RegistryFetchOptions {}

export interface RegistryFetchModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RegistryFetchOptions>;
  inject?: any[];
}
