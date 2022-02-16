import { Entity, Property } from '@mikro-orm/core';

@Entity()
export class RegistryOperator {
  @Property({ type: 'int', primary: true })
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
