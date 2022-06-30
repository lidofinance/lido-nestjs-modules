import { LidoKey, Pubkey } from './common';
import { CHAINS } from '@lido-nestjs/constants/src';

export interface LidoKeyValidatorInterface {
  validateKey(key: LidoKey, chainId: CHAINS): Promise<[Pubkey, boolean]>;
  validateKeys(keys: LidoKey[], chainId: CHAINS): Promise<[Pubkey, boolean][]>;
}
