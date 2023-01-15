import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  Property,
  t,
} from '@mikro-orm/core';

import { ConsensusMeta } from '../types';
import { ConsensusMetaRepository } from './consensus-meta.repository';

@Entity({
  tableName: 'consensus_meta',
  customRepository: () => ConsensusMetaRepository,
})
export class ConsensusMetaEntity implements ConsensusMeta {
  [EntityRepositoryType]?: ConsensusMetaRepository;

  public constructor(meta: ConsensusMeta) {
    this.slot = meta.slot;
    this.slotStateRoot = meta.slotStateRoot.toLocaleLowerCase();
    this.blockNumber = meta.blockNumber;
    this.blockHash = meta.blockHash.toLocaleLowerCase();
    this.timestamp = meta.timestamp;
  }

  // only one meta will exist in table
  @PrimaryKey({
    type: t.smallint,
    default: 0,
    unique: true,
    autoincrement: false,
  })
  public readonly id = 0;

  @Property({ type: t.integer, length: 66 })
  public slot: number;

  @Property({ type: t.string, length: 66 })
  public slotStateRoot: string;

  @PrimaryKey({ type: t.integer, length: 66 })
  public blockNumber: number;

  @Property({ type: t.string, length: 66 })
  public blockHash!: string;

  @Property({ type: t.integer, length: 66 })
  public timestamp!: number;
}
