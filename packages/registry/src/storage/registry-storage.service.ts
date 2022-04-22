import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

@Injectable()
export class RegistryStorageService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly orm: MikroORM) {}

  async onModuleInit(): Promise<void> {
    // TODO: think about migrations
    const generator = this.orm.getSchemaGenerator();
    await generator.updateSchema();
  }

  async onModuleDestroy(): Promise<void> {
    await this.orm.close();
  }
}
