import { EntityRepository } from '@mikro-orm/knex';
import { ConsensusMetaEntity } from './consensus-meta.entity';

export class ConsensusMetaRepository extends EntityRepository<ConsensusMetaEntity> {
  /** Replaces the only meta row; MikroORM 6 repositories have their own `upsert`. */
  public async replace(
    entity: ConsensusMetaEntity,
  ): Promise<ConsensusMetaEntity> {
    await this.nativeDelete({});

    return await this.createQueryBuilder().insert(entity).execute();
  }
}
