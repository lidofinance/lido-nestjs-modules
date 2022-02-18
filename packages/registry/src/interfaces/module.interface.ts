/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { Registry } from '@lido-nestjs/contracts';

export interface RegistryOptions {
  registryContract?: Registry;
}

export interface RegistryModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    RegistryOptions {}

export interface RegistryModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RegistryOptions>;
  inject?: any[];
}
