import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { RegistryOperatorRepository } from './operator.repository';

@Entity({ customRepository: () => RegistryOperatorRepository })
export class RegistryOperator {
  [EntityRepositoryType]?: RegistryOperatorRepository;

  constructor(operator: RegistryOperator) {
    this.index = operator.index;
    this.active = operator.active;
    this.name = operator.name;
    this.rewardAddress = operator.rewardAddress.toLocaleLowerCase();
    this.stakingLimit = operator.stakingLimit;
    this.stoppedValidators = operator.stoppedValidators;
    this.totalSigningKeys = operator.totalSigningKeys;
    this.usedSigningKeys = operator.usedSigningKeys;
  }

  @PrimaryKey()
  index!: number;

  @Property({ type: 'boolean' })
  active!: boolean;

  @Property({ type: 'varchar', length: 256 })
  name!: string;

  @Property({ type: 'varchar', length: 42 })
  rewardAddress!: string;

  @Property({ type: 'int' })
  stakingLimit!: number;

  @Property({ type: 'int' })
  stoppedValidators!: number;

  @Property({ type: 'int' })
  totalSigningKeys!: number;

  @Property({ type: 'int' })
  usedSigningKeys!: number;
}
