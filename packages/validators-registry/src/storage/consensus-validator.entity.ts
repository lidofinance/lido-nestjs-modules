import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  Property,
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

  public constructor(validator: Validator) {
    this.pubkey = validator.pubkey.toLocaleLowerCase();
    this.index = validator.index;
    this.status = validator.status;
  }

  @PrimaryKey({ type: t.string })
  pubkey: string;

  @Property({ type: t.integer })
  index: number;

  @Property()
  status: ValidatorStatus;
}
