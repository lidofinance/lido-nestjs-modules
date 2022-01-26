import { Inject, Injectable, Scope } from '@nestjs/common';
import {
  MiddlewareCallback,
  MiddlewareNext,
} from './interfaces/middleware.interface';
import { MIDDLEWARE_INITIAL } from './middleware.constants';

@Injectable({ scope: Scope.TRANSIENT })
export class MiddlewareService<T> {
  constructor(
    @Inject(MIDDLEWARE_INITIAL)
    private initial: MiddlewareCallback<T>[] | undefined,
  ) {
    this.initial?.forEach((middleware) => {
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
