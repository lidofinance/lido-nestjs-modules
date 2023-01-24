import { Migration20221225154138 } from '../../src/migrations/Migration20221225154138';
import { Migration20230119153937 } from '../../src/migrations/Migration20230119153937';

/**
 * Package migrations
 */
export const migrations = [
  { name: Migration20221225154138.name, class: Migration20221225154138 },
  { name: Migration20230119153937.name, class: Migration20230119153937 },
];
