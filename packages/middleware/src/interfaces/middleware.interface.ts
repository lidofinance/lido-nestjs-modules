/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { ModuleMetadata } from '@nestjs/common';

export interface MiddlewareCallback<Next, Payload> {
  (next: MiddlewareNext<Next, Payload>, payload?: Payload): Next;
}

export interface MiddlewareNext<Next, Payload> {
  (payload?: Payload): Next;
}

export interface MiddlewareModuleOptions<Next, Payload extends object = never> {
  middlewares?: MiddlewareCallback<Next, Payload>[];
}
export interface MiddlewareModuleAsyncOptions<
  Next,
  Payload extends object = never,
> extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<MiddlewareModuleOptions<Next, Payload>>;
  inject?: any[];
}
