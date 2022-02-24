import { EntityRepository } from '@mikro-orm/sqlite';
import { RegistryMeta } from './meta.entity';

export class RegistryMetaRepository extends EntityRepository<RegistryMeta> {}
