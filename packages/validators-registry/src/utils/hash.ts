/**
 * Hex of a hash in the case the rest of the module keeps it, `undefined` when there is none.
 */
export const normalizeHash = (hash?: string): string | undefined =>
  hash?.toLocaleLowerCase();
