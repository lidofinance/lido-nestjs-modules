import {
  Entity,
  EntityRepositoryType,
  Index,
  PrimaryKey,
  Property,
  Unique,
  t,
} from '@mikro-orm/core';
import { Validator, ValidatorStatus } from '../types';
import { ConsensusValidatorRepository } from './consensus-validator.repository';

@Entity({
  tableName: 'consensus_validator',
  customRepository: () => ConsensusValidatorRepository,
})
export class ConsensusValidatorEntity implements Validator {
  [EntityRepositoryType]?: ConsensusValidatorRepository;

  @PrimaryKey({ type: t.string, length: 98 })
  pubkey!: string;

  @Property({ type: t.integer })
  @Unique({ name: 'index' })
  index!: number;

  @Property({ length: 128 })
  @Index({ name: 'idx_consensus_validator__status' })
  status!: ValidatorStatus;
}
