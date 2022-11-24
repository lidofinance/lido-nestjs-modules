import type * as Fetch from 'node-fetch';

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
import { dynamicImport } from '@lido-nestjs/dynamic-esm';

const fetchCall = async (url: RequestInfo, init?: RequestInit) => {
  const mod = (await dynamicImport('node-fetch', module))
    .default as typeof Fetch.default;
  return mod(url, init);
};

@Injectable()
export class FetchService {
  constructor(
    @Optional()
    @Inject(FETCH_GLOBAL_OPTIONS_TOKEN)
    public options: FetchModuleOptions | null,

    private middlewareService: MiddlewareService<Promise<Fetch.Response>>,
  ) {
    this.options?.middlewares?.forEach((middleware) => {
      middlewareService.use(middleware);
    });
  }

  public async fetchJson<T>(url: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await this.wrappedRequest(url, init);
    return (await response.json()) as T;
  }

  public async fetchText(
    url: RequestInfo,
    init?: RequestInit,
  ): Promise<string> {
    const response = await this.wrappedRequest(url, init);
    return await response.text();
  }

  protected async wrappedRequest(
    url: RequestInfo,
    init?: RequestInit,
  ): Promise<Fetch.Response> {
    return await this.middlewareService.go(() => this.request(url, init));
  }

  protected async request(
    url: RequestInfo,
    init?: RequestInit,
    attempt = 0,
  ): Promise<Fetch.Response> {
    attempt++;

    try {
      const baseUrl = this.getBaseUrl(attempt);
      const fullUrl = this.getUrl(baseUrl, url);
      const response = await fetchCall(fullUrl, init);

      if (!response.ok) {
        const errorBody = await this.extractErrorBody(response);
        throw new HttpException(errorBody, response.status);
      }

      return response;
    } catch (error) {
      const possibleAttempt = this.getRetryAttempts(init);
      if (attempt > possibleAttempt) throw error;

      await this.delay(init);
      return await this.request(url, init, attempt);
    }
  }

  protected async delay(init?: RequestInit): Promise<void> {
    const timeout = this.getDelayTimeout(init);
    if (timeout <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  protected async extractErrorBody(
    response: Fetch.Response,
  ): Promise<string | Record<string, unknown>> {
    try {
      return (await response.json()) as string | Record<string, unknown>;
    } catch (error) {
      return response.statusText;
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
