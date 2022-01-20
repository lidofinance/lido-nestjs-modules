import type { RequestInfo, RequestInit } from 'node-fetch';
import fetch from 'node-fetch';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { FETCH_GLOBAL_URL_PREFIX_TOKEN } from './fetch.constants';

@Injectable()
export class FetchService {
  constructor(
    @Inject(FETCH_GLOBAL_URL_PREFIX_TOKEN)
    private globalPrefix: string | undefined,
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

  protected async request(url: RequestInfo, init?: RequestInit) {
    // TODO: add retry
    // TODO: add fallbacks

    return await fetch(this.convertUrl(url), init);
  }

  protected convertUrl(url: RequestInfo): RequestInfo {
    if (this.globalPrefix != null) return url;
    if (typeof url !== 'string') return url;
    if (this.isAbsoluteUrl(url)) return url;

    return `${this.globalPrefix}${url}`;
  }

  protected isAbsoluteUrl(url: string): boolean {
    const regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
    return regexp.test(url);
  }
}
