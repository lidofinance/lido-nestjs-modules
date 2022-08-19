import { KeySignPair } from './key-sign-pair';

export type NopKeysResult = {
  cid: string | null;
  data: KeySignPair[] | null;
  error: string | null;
};
