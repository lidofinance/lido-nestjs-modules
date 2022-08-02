import { LidoKey, Pubkey } from './common';
import { createInterface } from '@lido-nestjs/di';

export const LidoKeyValidatorInterface =
  createInterface<LidoKeyValidatorInterface>('LidoKeyValidatorInterface');

export interface LidoKeyValidatorInterface {
  validateKey(key: LidoKey): Promise<[Pubkey, boolean]>;
  validateKeys(keys: LidoKey[]): Promise<[Pubkey, boolean][]>;
}
