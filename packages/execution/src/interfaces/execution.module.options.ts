/* eslint-disable @typescript-eslint/no-explicit-any */

import { ModuleMetadata, Type } from '@nestjs/common';
import { RequestPolicy } from '../provider/extended-json-rpc-batch-provider';
import { ConnectionInfo } from '@ethersproject/web';
import { Networkish } from '@ethersproject/networks';

export interface ExecutionModuleOptions {
  url: ConnectionInfo | string;
  network?: Networkish;
  requestPolicy?: RequestPolicy;
}

export interface ExecutionModuleOptionsFactory {
  createExecutionModuleOptions():
    | Promise<ExecutionModuleOptions>
    | ExecutionModuleOptions;
}

export interface ExecutionModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  useExisting?: Type<ExecutionModuleOptionsFactory>;
  useClass?: Type<ExecutionModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<ExecutionModuleOptions> | ExecutionModuleOptions;
  inject?: any[];
}
