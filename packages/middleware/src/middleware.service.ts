import { Inject, Injectable, Optional, Scope } from '@nestjs/common';
import {
  MiddlewareModuleOptions,
  MiddlewareCallback,
  MiddlewareNext,
} from './interfaces/middleware.interface';
import { MIDDLEWARE_OPTIONS_TOKEN } from './middleware.constants';

@Injectable({ scope: Scope.TRANSIENT })
export class MiddlewareService<T> {
  constructor(
    @Optional()
    @Inject(MIDDLEWARE_OPTIONS_TOKEN)
    private options: MiddlewareModuleOptions<T> | undefined,
  ) {
    this.options?.middlewares?.forEach((middleware) => {
      this.use(middleware);
    });
  }

  use(callback: MiddlewareCallback<T>) {
    this.go = ((stack) => (next) => {
      return stack(callback.bind(this, next.bind(this)));
    })(this.go);
  }

  go = (next: MiddlewareNext<T>) => next();
}
