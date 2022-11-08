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
    private options: MiddlewareModuleOptions<Next, Payload>,
  ) {
    this.options?.middlewares?.forEach((middleware) => {
      this.use(middleware);
    });
  }

  use(callback: MiddlewareCallback<Next, Payload>) {
    this.go = this.wrap(this.go, callback);
  }

  private wrap(
    original: MiddlewareCallback<Next, Payload>,
    callback: MiddlewareCallback<Next, Payload>,
  ) {
    const old = original;
    return (next: MiddlewareNext<Next, Payload>, payload?: Payload) =>
      old(callback.bind(null, next.bind(null, payload), payload), payload);
  }

  go = (next: MiddlewareNext<Next, Payload>, payload?: Payload) =>
    next(payload);

  run(
    callbacks: ((
      next: MiddlewareNext<Next, Payload>,
      payload?: Payload,
    ) => Next)[],
    cb: MiddlewareNext<Next, Payload>,
    payload?: Payload,
  ) {
    const chain = callbacks.reduce(
      (acc, callback) => this.wrap(acc, callback),
      this.go,
    );
    return chain(cb, payload);
  }
}
