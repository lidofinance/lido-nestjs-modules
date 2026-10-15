import { Migration20221225154138 } from '../../src/migrations/Migration20221225154138';
import { Migration20230119153937 } from '../../src/migrations/Migration20230119153937';
import { Migration20260915120000 } from '../../src/migrations/Migration20260915120000';

/**
 * Package migrations the tests run.
 *
 * The tests run on SQLite, which cannot drop or add a table constraint. So the migrations that only move the primary
 * key around are left out: `Migration20221225154138` already creates the table with `id` alone as the key, which is
 * what those migrations end up with anyway.
 *
 * @see Migration20240221083613 left out, adds `block_number` to the key
 * @see Migration20260915120100 left out, takes `block_number` out of the key again
 */
export const migrations = [
  { name: Migration20221225154138.name, class: Migration20221225154138 },
  { name: Migration20230119153937.name, class: Migration20230119153937 },
  { name: Migration20260915120000.name, class: Migration20260915120000 },
];
