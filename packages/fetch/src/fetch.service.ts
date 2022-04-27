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
@Injectable()
export class FetchService {
  constructor(
    @Optional()
    @Inject(FETCH_GLOBAL_OPTIONS_TOKEN)
    public options: FetchModuleOptions | null,

    private middlewareService: MiddlewareService<Promise<unknown>>,
  ) {
    this.options?.middlewares?.forEach((middleware) => {
      middlewareService.use(middleware);
    });
  }

  public async fetchJson<T>(
    url: RequestInfo,
    init?: RequestInit<T>,
  ): Promise<T> {
    return this.wrappedRequest(
      url,
      async (response: Response, init?: RequestInit<T>) => {
        const json = (await response.json()) as T;
        return this.serialize(json, init);
      },
      init,
    );
  }

  public async fetchText(
    url: RequestInfo,
    init?: RequestInit<string>,
  ): Promise<string> {
    return this.wrappedRequest<string>(
      url,
      async (response: Response, init?: RequestInit<string>) => {
        const text = await response.text();
        return this.serialize(text, init);
      },
      init,
    );
  }

  protected async wrappedRequest<T>(
    url: RequestInfo,
    responseSerializer: ResponseSerializer<T>,
    init?: RequestInit<T>,
  ): Promise<T> {
    return this.middlewareService.go(
      () => this.request(url, responseSerializer, init),
      // TODO fix it
    ) as unknown as T;
  }

  protected async request<T>(
    url: RequestInfo,
    responseSerializer: ResponseSerializer<T>,
    init?: RequestInit<T>,
    attempt = 0,
  ): Promise<T> {
    attempt++;

    try {
      const baseUrl = this.getBaseUrl(attempt);
      const fullUrl = this.getUrl(baseUrl, url);
      const response = await fetch(fullUrl, init);

      if (!response.ok) {
        const errorBody = await this.extractErrorBody(response);
        throw new HttpException(errorBody, response.status);
      }
      const result = await responseSerializer(response, init);
      return result;
    } catch (error) {
      const possibleAttempt = this.getRetryAttempts(init);
      if (attempt > possibleAttempt) throw error;

      await this.delay(init);
      return await this.request(url, responseSerializer, init, attempt);
    }
  }

  protected async delay<T>(init?: RequestInit<T>): Promise<void> {
    const timeout = this.getDelayTimeout(init);
    if (timeout <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  protected async extractErrorBody(
    response: Response,
  ): Promise<string | Record<string, unknown>> {
    try {
      return await response.json();
    } catch (error) {
      return response.statusText;
    }
  }

  protected async serialize<T>(response: T, init?: RequestInit<T>) {
    const callback = init?.serializer;
    if (!callback) return response;
    return callback(response);
  }

  protected getRetryAttempts<T>(init?: RequestInit<T>): number {
    const localAttempts = init?.retryPolicy?.attempts;
    const globalAttempts = this.options?.retryPolicy?.attempts;

    if (localAttempts != null) return localAttempts;
    if (globalAttempts != null) return globalAttempts;
    return FETCH_GLOBAL_RETRY_DEFAULT_ATTEMPTS;
  }

  protected getDelayTimeout<T>(init?: RequestInit<T>): number {
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
