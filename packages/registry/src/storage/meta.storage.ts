import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/sqlite';
import { QueryOrder } from '@mikro-orm/core';
import { RegistryMeta } from './meta.entity';

@Injectable()
export class RegistryMetaStorageService {
  constructor(private readonly em: EntityManager) {}

  /** returns meta */
  async get(): Promise<RegistryMeta | null> {
    const result = await this.em
      .getRepository(RegistryMeta)
      .find({}, { orderBy: { blockNumber: QueryOrder.DESC }, limit: 1 });
    return result[0] ?? null;
  }

  /** removes meta */
  async remove() {
    return await this.em.getRepository(RegistryMeta).nativeDelete({});
  }

  /** saves meta */
  async save(registryMeta: RegistryMeta) {
    const repository = this.em.getRepository(RegistryMeta);
    const metaData = new RegistryMeta(registryMeta);
    return await repository.persistAndFlush(metaData);
  }
}
