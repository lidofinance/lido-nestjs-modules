import { EntityRepository } from '@mikro-orm/core';
import { RegistryKey } from './key.entity';

export class RegistryKeyRepository extends EntityRepository<RegistryKey> {}
