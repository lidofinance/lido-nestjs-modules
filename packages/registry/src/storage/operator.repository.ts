import { EntityRepository } from '@mikro-orm/sqlite';
import { RegistryOperator } from './operator.entity';

export class RegistryOperatorRepository extends EntityRepository<RegistryOperator> {}
