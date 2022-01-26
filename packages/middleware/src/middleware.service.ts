import { Inject, Injectable, Scope } from '@nestjs/common';
import {
  MiddlewareModuleOptions,
  MiddlewareCallback,
  MiddlewareNext,
} from './interfaces/middleware.interface';
import { MIDDLEWARE_OPTIONS } from './middleware.constants';

@Injectable({ scope: Scope.TRANSIENT })
export class MiddlewareService<T> {
  constructor(
    @Inject(MIDDLEWARE_OPTIONS)
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
