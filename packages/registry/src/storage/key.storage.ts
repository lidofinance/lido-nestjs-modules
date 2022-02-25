import { Injectable } from '@nestjs/common';
import { RegistryKey } from './key.entity';
import { RegistryKeyRepository } from './key.repository';

@Injectable()
export class RegistryKeyStorageService {
  constructor(private readonly repository: RegistryKeyRepository) {}

  /** find all keys */
  async findAll(): Promise<RegistryKey[]> {
    return await this.repository.findAll();
  }

  /** find all keys by operator */
  async findByOperatorIndex(operatorIndex: number): Promise<RegistryKey[]> {
    return await this.repository.find({ operatorIndex });
  }

  /** find key by index */
  async findOneByIndex(
    operatorIndex: number,
    keyIndex: number,
  ): Promise<RegistryKey | null> {
    return await this.repository.findOne({ operatorIndex, index: keyIndex });
  }

  /** removes key by index */
  async removeOneByIndex(operatorIndex: number, keyIndex: number) {
    return await this.repository.nativeDelete({
      operatorIndex,
      index: keyIndex,
    });
  }

  /** removes all keys */
  async removeAll() {
    return await this.repository.nativeDelete({});
  }

  /** saves key to storage */
  async saveOne(operatorKey: RegistryKey) {
    const key = new RegistryKey(operatorKey);
    return await this.repository.persistAndFlush(key);
  }

  /** saves multiply keys to storage */
  async save(operatorKeys: RegistryKey[]) {
    const result = await Promise.all(
      operatorKeys.map(async (operatorKey) => {
        const key = new RegistryKey(operatorKey);
        return await this.repository.persist(key);
      }),
    );

    this.repository.flush();
    return result;
  }
}
