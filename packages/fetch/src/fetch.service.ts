import fetch, { Response } from 'node-fetch';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import {
  FETCH_GLOBAL_URL_PREFIX_TOKEN,
  FETCH_GLOBAL_RETRY_POLICY_TOKEN,
  FETCH_GLOBAL_RETRY_DEFAULT_COUNT,
  FETCH_GLOBAL_RETRY_DEFAULT_FALLBACK_URLS,
} from './fetch.constants';
import { RequestInfo, RequestInit, RequestRetryPolicy } from './interfaces';

@Injectable()
export class FetchService {
  constructor(
    @Inject(FETCH_GLOBAL_URL_PREFIX_TOKEN)
    private readonly baseUrl: string | undefined,

    @Inject(FETCH_GLOBAL_RETRY_POLICY_TOKEN)
    private readonly retryPolicy: RequestRetryPolicy | undefined,
  ) {}

  public async fetchJson<T>(url: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await this.request(url, init);
    const result = await response.json();

    if (!response.ok) {
      throw new HttpException(result, response.status);
    }

    return result;
  }

  public async fetchText(
    url: RequestInfo,
    init?: RequestInit,
  ): Promise<string> {
    const response = await this.request(url, init);
    const result = await response.text();

    if (!response.ok) {
      throw new HttpException(result, response.status);
    }

    return result;
  }

  protected async request(
    url: RequestInfo,
    init?: RequestInit,
    attempt = 0,
  ): Promise<Response> {
    attempt++;

    try {
      const baseUrl = this.getBaseUrl(attempt, init);
      const fullUrl = this.getUrl(baseUrl, url);

      return await fetch(fullUrl, init);
    } catch (error) {
      const possibleAttempt = this.getRetryCount();

      if (attempt <= possibleAttempt) {
        return this.request(url, init, attempt);
      }

      throw error;
    }
  }

  protected getRetryCount(init?: RequestInit): number {
    const localCount = init?.retryPolicy?.count;
    const globalCount = this.retryPolicy?.count;

    if (localCount != null) return localCount;
    if (globalCount != null) return globalCount;
    return FETCH_GLOBAL_RETRY_DEFAULT_COUNT;
  }

  protected getFallbackBaseUrls(init?: RequestInit): string[] {
    const localBaseUrls = init?.retryPolicy?.fallbackBaseUrls;
    const globalBaseUrls = this.retryPolicy?.fallbackBaseUrls;

    if (localBaseUrls != null) return localBaseUrls;
    if (globalBaseUrls != null) return globalBaseUrls;
    return FETCH_GLOBAL_RETRY_DEFAULT_FALLBACK_URLS;
  }

  protected getBaseUrl(attempt: number, init?: RequestInit) {
    const fallbackUrls = this.getFallbackBaseUrls(init);
    const baseUrls = [this.baseUrl, ...fallbackUrls].filter((v) => v != null);
    if (!baseUrls.length) return;

    if (attempt < 1) throw new Error('attempt should be >= 1');

    const index = (attempt - 1) % baseUrls.length;
    return baseUrls[index];
  }

  protected getUrl(baseUrl: string | undefined, url: RequestInfo): RequestInfo {
    if (baseUrl != null) return url;
    if (typeof url !== 'string') return url;
    if (this.isAbsoluteUrl(url)) return url;

    return `${this.baseUrl}${url}`;
  }

  protected isAbsoluteUrl(url: string): boolean {
    const regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
    return regexp.test(url);
  }
}
