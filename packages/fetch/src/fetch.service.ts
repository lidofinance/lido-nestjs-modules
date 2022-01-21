import fetch, { Response } from 'node-fetch';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import {
  FETCH_GLOBAL_URL_PREFIX_TOKEN,
  FETCH_GLOBAL_RETRY_POLICY_TOKEN,
  FETCH_GLOBAL_RETRY_DEFAULT_ATTEMPTS,
  FETCH_GLOBAL_RETRY_DEFAULT_BASE_URLS,
  FETCH_GLOBAL_RETRY_DEFAULT_DELAY,
} from './fetch.constants';
import { RequestInfo, RequestInit, RequestRetryPolicy } from './interfaces';

@Injectable()
export class FetchService {
  constructor(
    @Inject(FETCH_GLOBAL_URL_PREFIX_TOKEN)
    private baseUrls: string[],

    @Inject(FETCH_GLOBAL_RETRY_POLICY_TOKEN)
    private retryPolicy: RequestRetryPolicy | null,
  ) {}

  public async fetchJson<T>(url: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await this.request(url, init);
    return await response.json();
  }

  public async fetchText(
    url: RequestInfo,
    init?: RequestInit,
  ): Promise<string> {
    const response = await this.request(url, init);
    return await response.text();
  }

  protected async request(
    url: RequestInfo,
    init?: RequestInit,
    attempt = 0,
  ): Promise<Response> {
    attempt++;

    try {
      const baseUrl = this.getBaseUrl(attempt);
      const fullUrl = this.getUrl(baseUrl, url);
      const response = await fetch(fullUrl, init);

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
    response: Response,
  ): Promise<string | Record<string, unknown>> {
    try {
      return await response.json();
    } catch (error) {
      return response.statusText;
    }
  }

  protected getRetryAttempts(init?: RequestInit): number {
    const localAttempts = init?.retryPolicy?.attempts;
    const globalAttempts = this.retryPolicy?.attempts;

    if (localAttempts != null) return localAttempts;
    if (globalAttempts != null) return globalAttempts;
    return FETCH_GLOBAL_RETRY_DEFAULT_ATTEMPTS;
  }

  protected getDelayTimeout(init?: RequestInit): number {
    const localDelay = init?.retryPolicy?.delay;
    const globalDelay = this.retryPolicy?.delay;

    if (localDelay != null) return localDelay;
    if (globalDelay != null) return globalDelay;
    return FETCH_GLOBAL_RETRY_DEFAULT_DELAY;
  }

  protected getBaseUrl(attempt: number) {
    const baseUrls = this.baseUrls ?? FETCH_GLOBAL_RETRY_DEFAULT_BASE_URLS;
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
