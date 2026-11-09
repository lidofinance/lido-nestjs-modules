import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { RegistryKeyRepository } from './key.repository';

@Entity({ repository: () => RegistryKeyRepository })
export class RegistryKey {
  [EntityRepositoryType]?: RegistryKeyRepository;
  [PrimaryKeyProp]?: ['index', 'operatorIndex'];

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

  @Property({ length: 98 })
  key!: string;

  @Property({ length: 194 })
  depositSignature!: string;

  @Property()
  used!: boolean;
}
