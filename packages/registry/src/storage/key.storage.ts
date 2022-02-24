import { Injectable } from '@nestjs/common';
import { RegistryKey } from './key.entity';
import { EntityManager } from '@mikro-orm/sqlite';

@Injectable()
export class RegistryKeyStorageService {
  constructor(private readonly em: EntityManager) {}

  /** find all keys */
  async findAll(): Promise<RegistryKey[]> {
    return await this.em.getRepository(RegistryKey).findAll();
  }

  /** find all keys by operator */
  async findByOperatorIndex(operatorIndex: number): Promise<RegistryKey[]> {
    return await this.em.getRepository(RegistryKey).find({ operatorIndex });
  }

  /** find key by index */
  async findOneByIndex(
    operatorIndex: number,
    keyIndex: number,
  ): Promise<RegistryKey | null> {
    return await this.em
      .getRepository(RegistryKey)
      .findOne({ operatorIndex, index: keyIndex });
  }

  /** removes key by index */
  async removeOneByIndex(operatorIndex: number, keyIndex: number) {
    return await this.em
      .getRepository(RegistryKey)
      .nativeDelete({ operatorIndex, index: keyIndex });
  }

  /** removes all keys */
  async removeAll() {
    return await this.em.getRepository(RegistryKey).nativeDelete({});
  }

  /** saves key to storage */
  async saveOne(operatorKey: RegistryKey) {
    const repository = this.em.getRepository(RegistryKey);
    const key = this.em.create(RegistryKey, operatorKey);
    return await repository.persistAndFlush(key);
  }

  /** saves multiply keys to storage */
  async save(operatorKeys: RegistryKey[]) {
    const repository = this.em.getRepository(RegistryKey);

    await Promise.all(
      operatorKeys.map(async (operatorKey) => {
        const key = this.em.create(RegistryKey, operatorKey);
        return await repository.persist(key);
      }),
    );

    repository.flush();
  }
}
