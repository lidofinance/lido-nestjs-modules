/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';

export interface KeyValidatorModuleOptions {
  multithreaded: boolean;
}

export interface KeyValidatorModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'>, // TODO think about providers here
    KeyValidatorModuleOptions {}

export interface KeyValidatorModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<KeyValidatorModuleOptions>;
  inject?: any[];
}
