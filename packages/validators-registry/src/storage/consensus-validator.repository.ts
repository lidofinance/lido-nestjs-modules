import { EntityRepository } from '@mikro-orm/knex';
import { ConsensusValidatorEntity } from './consensus-validator.entity';

export class ConsensusValidatorRepository extends EntityRepository<ConsensusValidatorEntity> {
  public async upsertAll(
    entities: ConsensusValidatorEntity[],
  ): Promise<{ lastID: number; changes: number }> {
    // TODO Are ETH validator pubkeys deleted from consensus layer when validator is exited

    // INSERT INTO <table_name> (<props>) VALUES (<values>) ON DUPLICATE KEY UPDATE;
    return await this.createQueryBuilder()
      .insert(entities)
      .onConflict('pubkey')
      .merge()
      .execute();
  }
}
