import { Migration } from '@mikro-orm/migrations';

/**
 * PLEASE DO NOT EDIT !!!
 *
 * This migration can be used in the applications that use this module.
 *
 * Takes `block_number` out of the primary key, so that the key is `id` alone.
 *
 * The table holds one row and always has: `id` is always 0 and is unique. So the second column of the key never told
 * two rows apart, while it did make the key depend on a number that is no longer bound to a slot. Since Gloas
 * (EIP-7732) a builder may fail to reveal its payload, and then the next slots keep the execution layer block of an
 * earlier one, so `block_number` can stay the same while `slot` moves on.
 *
 * `if exists` keeps the migration working on a database where the key was never made a composite one.
 *
 * The unique constraint on `id` is left in place. The primary key already makes `id` unique, so the constraint only
 * costs an extra index on a single row table, and dropping it would give nothing back.
 *
 * @see Migration20240221083613 the migration that made the key a composite one
 */
export class Migration20260915120100 extends Migration {
  /**
   * @see ConsensusMetaEntity
   */
  async up(): Promise<void> {
    this.addSql(
      'alter table "consensus_meta" drop constraint if exists "consensus_meta_pkey";',
    );
    this.addSql(
      'alter table "consensus_meta" add constraint "consensus_meta_pkey" primary key ("id");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "consensus_meta" drop constraint if exists "consensus_meta_pkey";',
    );
    this.addSql(
      'alter table "consensus_meta" add constraint "consensus_meta_pkey" primary key ("id", "block_number");',
    );
  }
}
