/* eslint-disable @typescript-eslint/no-explicit-any */

import { ModuleMetadata } from '@nestjs/common';
import { SimpleFallbackProviderConfig } from './simple-fallback-provider-config';
import { ConnectionInfo } from '@ethersproject/web';
import { Networkish } from './networkish';
import { RequestPolicy } from '../provider/extended-json-rpc-batch-provider';
import { MiddlewareCallback } from '@lido-nestjs/middleware';

export interface FallbackProviderModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    SimpleFallbackProviderConfig {}

export interface BatchProviderModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  url: ConnectionInfo | string;
  network?: Networkish;
  requestPolicy?: RequestPolicy;
  fetchMiddlewares?: MiddlewareCallback<Promise<any>>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface FallbackProviderModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  useFactory: (
    ...args: any[]
  ) =>
    | Promise<FallbackProviderModuleSyncOptions>
    | FallbackProviderModuleSyncOptions;
  inject: any[];
}

export interface BatchProviderModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  useFactory: (
    ...args: any[]
  ) => Promise<BatchProviderModuleSyncOptions> | BatchProviderModuleSyncOptions;
  inject: any[];
}
