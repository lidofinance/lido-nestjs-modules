import { HttpException, Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import type { RequestInfo, RequestInit } from 'node-fetch';

@Injectable()
export class FetchService {
  // TODO: add retry, fallbacks

  public async fetch<T>(url: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result = await response.json();

    if (!response.ok) {
      throw new HttpException(result, response.status);
    }

    return result;
  }
}
