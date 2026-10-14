import { Migration } from '@mikro-orm/migrations';

/**
 * PLEASE DO NOT EDIT !!!
 *
 * This migration can be used in the applications that use this module.
 *
 * Adds the slot whose execution payload the `block_number`, `block_hash` and `timestamp` columns describe.
 *
 * The column stays empty up to Fulu, where a block carries its own payload and the slot is always the one in the
 * `slot` column. Since Gloas (EIP-7732) the payload is revealed apart from the block, so the state of a slot only has
 * the payload of an earlier block and the two slots come apart.
 */
export class Migration20260915120000 extends Migration {
  /**
   * @see ConsensusMetaEntity
   */
  async up(): Promise<void> {
    this.addSql('alter table "consensus_meta" add column "payload_slot" int;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "consensus_meta" drop column "payload_slot";');
  }
}
