import { FetchService } from '@lido-nestjs/fetch';
import { RequestInit } from 'node-fetch';

export class ConsensusBaseService {
  constructor(private fetchService: FetchService) {}

  public async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    return await this.fetchService.fetchJson(path, init);
  }
}
