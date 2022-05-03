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
  ResponseSerializer,
} from './interfaces/fetch.interface';

type Cb<P> = (payload: P) => Cb<P>;

type LocalPayload = {
  response: Response;
  data: unknown;
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
    return this.request(
      url,
      async (response: Response, init?: RequestInit) => {
        const json = (await response.json()) as T;
        return this.runMiddlewares<T>({ response, data: json }, init);
      },
      init,
    );
  }

  public async fetchText(
    url: RequestInfo,
    init?: RequestInit,
  ): Promise<string | undefined> {
    return this.request(
      url,
      async (response: Response, init?: RequestInit) => {
        const text = await response.text();
        return this.runMiddlewares<string>({ response, data: text }, init);
      },
      init,
    );
  }

  protected async request<T>(
    url: RequestInfo,
    responseSerializer: ResponseSerializer<T>,
    init?: RequestInit,
    attempt = 0,
  ): Promise<T> {
    attempt++;

    try {
      const baseUrl = this.getBaseUrl(attempt);
      const fullUrl = this.getUrl(baseUrl, url);
      const response = await fetch(fullUrl, init);
      const result = await responseSerializer(response, init);
      return result;
    } catch (error) {
      const possibleAttempt = this.getRetryAttempts(init);
      if (attempt > possibleAttempt) throw error;

      await this.delay(init);
      return await this.request(url, responseSerializer, init, attempt);
    }
  }

  protected async delay(init?: RequestInit): Promise<void> {
    const timeout = this.getDelayTimeout(init);
    if (timeout <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  protected async runMiddlewares<T>(
    payload: LocalPayload,
    init?: RequestInit,
  ): Promise<T | undefined> {
    const middlewares = init?.middlewares || [];
    return (await this.middlewareService.run(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      middlewares,
      async (payload) => {
        if (!payload) return;
        const data = payload.data as T;
        if (!payload.response.ok) {
          throw new HttpException(data, payload.response.status);
        }
        return data;
      },
      payload,
    )) as unknown as T; // TODO
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
