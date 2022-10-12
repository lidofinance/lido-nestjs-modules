import fetch, { Response } from 'node-fetch';
import { HttpException, Inject, Injectable, Optional } from '@nestjs/common';
import { MiddlewareService } from '@lido-nestjs/middleware';
import {
  FETCH_GLOBAL_OPTIONS_TOKEN,
  FETCH_GLOBAL_RETRY_DEFAULT_ATTEMPTS,
  FETCH_GLOBAL_RETRY_DEFAULT_BASE_URLS,
  FETCH_GLOBAL_RETRY_DEFAULT_DELAY,
} from './fetch.constants';
import {
  RequestInfo,
  RequestInit,
  FetchModuleOptions,
} from './interfaces/fetch.interface';
import { MiddlewareCallback } from '@lido-nestjs/middleware';

type Cb<P> = (payload: P) => Cb<P>;

type LocalPayload = {
  response?: Response;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  statusCode?: number;
};
@Injectable()
export class FetchService {
  constructor(
    @Optional()
    @Inject(FETCH_GLOBAL_OPTIONS_TOKEN)
    public options: FetchModuleOptions | null,

    private middlewareService: MiddlewareService<
      Promise<Cb<LocalPayload>>,
      LocalPayload
    >,
  ) {
    this.options?.middlewares?.forEach((middleware) => {
      middlewareService.use(middleware);
    });
  }

  public async fetchJson<T>(
    url: RequestInfo,
    init?: RequestInit,
  ): Promise<T | undefined> {
    return await this.runMiddlewares<T>(
      url,
      async (next, payload) => {
        if (!payload || !payload.response) return await next();
        payload.data = await payload.response.json();
        return await next();
      },
      init,
    );
  }

  public async fetchText(
    url: RequestInfo,
    init?: RequestInit,
  ): Promise<string | undefined> {
    return await this.runMiddlewares<string>(
      url,
      async (next, payload) => {
        if (!payload || !payload.response) return await next();
        payload.data = await payload.response.text();
        return await next();
      },
      init,
    );
  }

  protected async delay(init?: RequestInit): Promise<void> {
    const timeout = this.getDelayTimeout(init);
    if (timeout <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  protected async runMiddlewares<T>(
    url: RequestInfo,
    middleware: MiddlewareCallback<Promise<Cb<LocalPayload>>, LocalPayload>,
    init?: RequestInit,
    attempt = 0,
  ): Promise<T> {
    attempt++;
    const middlewares = init?.middlewares || [];

    try {
      return (await this.middlewareService.run(
        [
          async (next, payload) => {
            const baseUrl = this.getBaseUrl(attempt);
            const fullUrl = this.getUrl(baseUrl, url);
            const response = await fetch(fullUrl, init);
            if (payload) payload.response = response;
            return await next();
          },
          middleware,
          ...middlewares,
        ],
        async (payload) => {
          if (!payload || !payload.response) return;
          const data = payload.data;
          if (!payload.response.ok) {
            throw new HttpException(data, payload?.response.status);
          }
          return data;
        },
        {},
      )) as unknown as T;
    } catch (error) {
      // if (!(error instanceof HttpException)) throw error;
      const possibleAttempt = this.getRetryAttempts(init);
      if (attempt > possibleAttempt) throw error;
      await this.delay(init);
      const attempts = await this.runMiddlewares<T>(
        url,
        middleware,
        init,
        attempt,
      );
      return attempts as T;
    }
  }

  protected getRetryAttempts(init?: RequestInit): number {
    const localAttempts = init?.retryPolicy?.attempts;
    const globalAttempts = this.options?.retryPolicy?.attempts;

    if (localAttempts != null) return localAttempts;
    if (globalAttempts != null) return globalAttempts;
    return FETCH_GLOBAL_RETRY_DEFAULT_ATTEMPTS;
  }

  protected getDelayTimeout(init?: RequestInit): number {
    const localDelay = init?.retryPolicy?.delay;
    const globalDelay = this.options?.retryPolicy?.delay;

    if (localDelay != null) return localDelay;
    if (globalDelay != null) return globalDelay;
    return FETCH_GLOBAL_RETRY_DEFAULT_DELAY;
  }

  protected getBaseUrl(attempt: number) {
    const defaultBaseUrls = FETCH_GLOBAL_RETRY_DEFAULT_BASE_URLS;
    const baseUrls = this.options?.baseUrls ?? defaultBaseUrls;
    if (!baseUrls.length) return null;

    const index = (attempt - 1) % baseUrls.length;
    return baseUrls[index];
  }

  protected getUrl(baseUrl: string | null, url: RequestInfo): RequestInfo {
    if (typeof url !== 'string') return url;
    if (baseUrl == null) return url;
    if (this.isAbsoluteUrl(url)) return url;

    return `${baseUrl}${url}`;
  }

  protected isAbsoluteUrl(url: string): boolean {
    const regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
    return regexp.test(url);
  }
}
