import { Key, LidoKey } from './common';
import { createInterface } from '@lido-nestjs/di';

export const LidoKeyValidatorInterface =
  createInterface<LidoKeyValidatorInterface>('LidoKeyValidatorInterface');

export interface LidoKeyValidatorInterface {
  validateKey(key: LidoKey): Promise<[Key & LidoKey, boolean]>;
  validateKeys(keys: LidoKey[]): Promise<[Key & LidoKey, boolean][]>;
}
