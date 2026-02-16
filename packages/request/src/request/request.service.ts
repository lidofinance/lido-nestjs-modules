import { Inject, Injectable, Optional } from '@nestjs/common';
import { Middleware, RequestConfig } from '../interfaces';
import { compose } from '../compose';
import { REQUEST_GLOBAL_OPTIONS_TOKEN } from '.';
import { RequestModuleOptions } from '../interfaces/request.interface';

@Injectable()
export class RequestService {
  constructor(
    @Optional()
    @Inject(REQUEST_GLOBAL_OPTIONS_TOKEN)
    private readonly options: RequestModuleOptions,
  ) {}

  public async json<T>(
    config: RequestConfig,
    middlewares: Middleware[] = [],
  ): Promise<T> {
    const response = await compose([...this.globalMiddlewares, ...middlewares])(
      this.resolveConfig(config),
    );
    return await response.json();
  }

  public async text(
    config: RequestConfig,
    middlewares: Middleware[] = [],
  ): Promise<string> {
    const response = await compose([...this.globalMiddlewares, ...middlewares])(
      this.resolveConfig(config),
    );
    return await response.text();
  }

  get globalMiddlewares() {
    return this.options?.middlewares ?? [];
  }

  private resolveConfig(config: RequestConfig) {
    return { ...this.options?.globalConfig, ...config };
  }
}
