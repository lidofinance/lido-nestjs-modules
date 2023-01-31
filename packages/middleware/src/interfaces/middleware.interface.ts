/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';

export interface MiddlewareCallback<T> {
  (next: MiddlewareNext<T>, ctx: any): T;
}

export interface MiddlewareNext<T> {
  (): T;
}

export interface MiddlewareModuleOptions<T> {
  middlewares?: MiddlewareCallback<T>[];
}

export interface MiddlewareModuleAsyncOptions<T>
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<MiddlewareModuleOptions<T>>;
  inject?: any[];
}
