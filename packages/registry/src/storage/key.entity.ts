import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  PrimaryKeyType,
  Property,
} from '@mikro-orm/core';
import { RegistryKeyRepository } from './key.repository';

@Entity({ customRepository: () => RegistryKeyRepository })
export class RegistryKey {
  [EntityRepositoryType]?: RegistryKeyRepository;
  [PrimaryKeyType]?: [number, number];

  constructor(operatorKey: RegistryKey) {
    this.index = operatorKey.index;
    this.operatorIndex = operatorKey.operatorIndex;
    this.key = operatorKey.key.toLocaleLowerCase();
    this.depositSignature = operatorKey.depositSignature.toLocaleLowerCase();
    this.used = operatorKey.used;
  }

  @PrimaryKey()
  index!: number;

  @PrimaryKey()
  operatorIndex!: number;

  @Property({ type: 'varchar', length: 98 })
  key!: string;

  @Property({ type: 'varchar', length: 194 })
  depositSignature!: string;

  @Property({ type: 'boolean' })
  used!: boolean;
}
