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
    this.epoch = meta.epoch;
    this.slotStateRoot = meta.slotStateRoot;
    this.blockNumber = meta.blockNumber;
    this.blockHash = meta.blockHash;
    this.timestamp = meta.timestamp;
    this.payloadSlot = meta.payloadSlot;
  }

  // only one meta will exist in table
  @PrimaryKey({
    type: t.smallint,
    default: 0,
    unique: true,
    autoincrement: false,
  })
  public readonly id = 0;

  @Property({ type: t.integer })
  public epoch: number;

  @Property({ type: t.integer })
  public slot: number;

  @Property({ type: t.string, length: 66 })
  public slotStateRoot: string;

  @Property({ type: t.integer })
  public blockNumber: number;

  @Property({ type: t.string, length: 66 })
  public blockHash!: string;

  @Property({ type: t.integer })
  public timestamp!: number;

  /**
   * Slot whose execution payload the `blockNumber`, `blockHash` and `timestamp` fields describe.
   *
   * Empty up to Fulu, where a block carries its own payload and this is always the `slot` field itself.
   */
  @Property({ type: t.integer, nullable: true })
  public payloadSlot?: number;
}
