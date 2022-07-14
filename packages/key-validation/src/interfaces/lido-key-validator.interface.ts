import { LidoKey, Pubkey } from './common';
import { CHAINS } from '@lido-nestjs/constants';
import { createInterface } from '@lido-nestjs/di';

export const LidoKeyValidatorInterface =
  createInterface<LidoKeyValidatorInterface>('LidoKeyValidatorInterface');

export interface LidoKeyValidatorInterface {
  validateKey(key: LidoKey, chainId: CHAINS): Promise<[Pubkey, boolean]>;
  validateKeys(keys: LidoKey[], chainId: CHAINS): Promise<[Pubkey, boolean][]>;
}