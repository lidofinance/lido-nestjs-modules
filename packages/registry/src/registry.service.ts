import { Inject, Injectable, Optional } from '@nestjs/common';
import { REGISTRY_OPTIONS_TOKEN } from './registry.constants';
import { RegistryOptions } from './interfaces/module.interface';

@Injectable()
export class RegistryService {
  constructor(
    @Optional()
    @Inject(REGISTRY_OPTIONS_TOKEN)
    public options: RegistryOptions | null,
  ) {}

  public async updateStoredData() {
    // TODO
  }
}
