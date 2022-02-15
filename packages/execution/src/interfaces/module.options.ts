/* eslint-disable @typescript-eslint/no-explicit-any */

import { ModuleMetadata } from '@nestjs/common';
import { SimpleFallbackProviderConfig } from './simple-fallback-provider-config';

export interface ExecutionModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    SimpleFallbackProviderConfig {}

export interface ExecutionModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  useFactory: (
    ...args: any[]
  ) => Promise<ExecutionModuleSyncOptions> | ExecutionModuleSyncOptions;
  inject?: any[];
}
