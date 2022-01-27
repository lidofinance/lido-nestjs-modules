import snakeCase from 'lodash.snakecase';
import { RequestInit } from 'node-fetch';
import { FetchService } from '@lido-nestjs/fetch';
import { Inject, Injectable } from '@nestjs/common';
import { CONSENSUS_OPTIONS_TOKEN } from '../consensus.constants';
import { ConsensusModuleOptions } from '../interfaces/module.interface';

@Injectable()
export class ConsensusBaseService {
  constructor(
    @Inject(CONSENSUS_OPTIONS_TOKEN)
    public options: ConsensusModuleOptions | null,

    protected fetchService: FetchService,
  ) {}

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
    const searchString = searchParams.toString();
    return searchString ? `?${searchString}` : '';
  }
}
