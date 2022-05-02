/* eslint-disable @typescript-eslint/ban-types */
import { Inject, Injectable, Optional, Scope } from '@nestjs/common';
import {
  MiddlewareModuleOptions,
  MiddlewareCallback,
  MiddlewareNext,
} from './interfaces/middleware.interface';
import { MIDDLEWARE_OPTIONS_TOKEN } from './middleware.constants';

@Injectable({ scope: Scope.TRANSIENT })
export class MiddlewareService<Next, Payload extends object = {}> {
  constructor(
    @Optional()
    @Inject(MIDDLEWARE_OPTIONS_TOKEN)
    private options: MiddlewareModuleOptions<Next, Payload> | undefined,
  ) {
    this.options?.middlewares?.forEach((middleware) => {
      this.use(middleware);
    });
  }

  use(callback: MiddlewareCallback<Next, Payload>) {
    const old = this.go;

    this.go = (next, payload) =>
      old(callback.bind(this, next.bind(this, payload), payload), payload);
  }

  go = (next: MiddlewareNext<Next, Payload>, payload?: Payload) =>
    next(payload);
}
