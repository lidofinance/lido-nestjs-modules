import { EntityRepository } from '@mikro-orm/knex';
import { ConsensusMetaEntity } from './consensus-meta.entity';

export class ConsensusMetaRepository extends EntityRepository<ConsensusMetaEntity> {
  public async upsert(
    entity: ConsensusMetaEntity,
  ): Promise<{ lastID: number; changes: number }> {
    // INSERT INTO <table_name> (<props>) VALUES (<values>) ON DUPLICATE KEY UPDATE;
    return await this.createQueryBuilder()
      .insert(entity)
      .onConflict('id')
      .merge()
      .execute();
  }
}
