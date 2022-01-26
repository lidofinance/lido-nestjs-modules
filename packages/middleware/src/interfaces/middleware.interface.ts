export interface MiddlewareCallback<T> {
  (next: MiddlewareNext<T>): T;
}

export interface MiddlewareNext<T> {
  (): T;
}

export interface MiddlewareModuleOptions<T> {
  middlewares?: MiddlewareCallback<T>[];
}
