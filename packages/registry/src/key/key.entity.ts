import { Entity, Property } from '@mikro-orm/core';

@Entity()
export class RegistryKey {
  @Property({ type: 'int', primary: true })
  index!: number;

  @Property({ type: 'int', primary: true })
  operatorIndex!: number;

  @Property({ type: 'varchar', length: 98 })
  key!: string;

  @Property({ type: 'varchar', length: 194 })
  signature!: string;

  @Property({ type: 'boolean' })
  used!: boolean;
}
