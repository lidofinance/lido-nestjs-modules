import { Inject } from '@nestjs/common';
import { RequestInit } from 'node-fetch';
import { CONSENSUS_API_URL_TOKEN } from '../consensus.constants';
import { FetchService } from '../fetch';

export class ConsensusBaseService {
  constructor(
    @Inject(CONSENSUS_API_URL_TOKEN)
    private apiUrl: string,

    private fetchService: FetchService,
  ) {}

  public fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = this.apiUrl;
    const url = `${baseUrl}${path}`;

    // TODO: retry, fallbacks
    return this.fetchService.fetch(url, init);
  }
}
