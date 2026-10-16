import { ModuleMetadata } from '@nestjs/common';
import { Middleware, RequestConfig } from './index';

export interface RequestModuleOptions {
  readonly middlewares?: Middleware[];
  readonly globalConfig?: RequestConfig;
}
export interface RequestModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory: (...args: any[]) => Promise<RequestModuleOptions>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
}
