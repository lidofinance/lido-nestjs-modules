import { Inject, Injectable, Optional } from '@nestjs/common';
import { REGISTRY_FETCH_OPTIONS_TOKEN } from './registry-fetch.constants';
import { RegistryFetchOptions } from './interfaces/module.interface';

@Injectable()
export class RegistryFetchService {
  constructor(
    @Optional()
    @Inject(REGISTRY_FETCH_OPTIONS_TOKEN)
    private readonly options: RegistryFetchOptions | null,
  ) {}
}
