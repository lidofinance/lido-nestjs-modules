import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { REGISTRY_STORAGE_OPTIONS_TOKEN } from './registry-storage.constants';
import { RegistryStorageOptions } from './interfaces/module.interface';
import { MikroORM } from '@mikro-orm/core';

@Injectable()
export class RegistryStorageService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Optional()
    @Inject(REGISTRY_STORAGE_OPTIONS_TOKEN)
    private readonly options: RegistryStorageOptions | null,

    private readonly orm: MikroORM,
  ) {}

  async onModuleInit(): Promise<void> {
    const generator = this.orm.getSchemaGenerator();
    await generator.updateSchema();
  }

  async onModuleDestroy(): Promise<void> {
    await this.orm.close();
  }
}
