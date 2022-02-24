import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { RegistryMetaRepository } from './meta.repository';

@Entity({ customRepository: () => RegistryMetaRepository })
export class RegistryMeta {
  [EntityRepositoryType]?: RegistryMetaRepository;

  constructor(meta: RegistryMeta) {
    this.blockNumber = meta.blockNumber;
    this.blockHash = meta.blockHash.toLocaleLowerCase();
    this.keysOpIndex = meta.keysOpIndex;
    this.unbufferedBlockNumber = meta.unbufferedBlockNumber;
  }

  @PrimaryKey()
  blockNumber!: number;

  @Property({ type: 'varchar', length: 66 })
  blockHash!: string;

  @Property({ type: 'int' })
  keysOpIndex?: number;

  @Property({ type: 'int' })
  unbufferedBlockNumber?: number;
}
