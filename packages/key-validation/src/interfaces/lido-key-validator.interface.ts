import { Int } from './common';
import { CHAINS } from '@lido-nestjs/constants/src';

export type Pubkey = string;

export interface Key {
  index?: Int;
  key: Pubkey;
  depositSignature: string;
  used: boolean;
}

export interface LidoKeyValidatorInterface {
  validateKey(key: Key, chainId: CHAINS): Promise<[Pubkey, boolean]>;
  validateKeys(keys: Key[], chainId: CHAINS): Promise<[Pubkey, boolean][]>;
}
