import { EntityRepository } from '@mikro-orm/sqlite';
import { RegistryKey } from './key.entity';

export class RegistryKeyRepository extends EntityRepository<RegistryKey> {}
