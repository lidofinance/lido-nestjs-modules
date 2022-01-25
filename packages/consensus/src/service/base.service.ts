import snakeCase from 'lodash.snakecase';
import { RequestInit } from 'node-fetch';
import { FetchService } from '@lido-nestjs/fetch';

export class ConsensusBaseService {
  constructor(protected fetchService: FetchService) {}

  public async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    return await this.fetchService.fetchJson(path, init);
  }

  public getSearchString(
    queryObject: Record<string, string[] | string | number | undefined>,
  ): string {
    const searchParams = new URLSearchParams();
    Object.entries(queryObject).forEach(([key, value]) => {
      if (value == null) return;
      searchParams.append(snakeCase(key), String(value));
    });
    return searchParams.toString();
  }
}
