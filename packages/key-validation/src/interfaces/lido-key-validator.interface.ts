import { Key, LidoKey } from './common';
import { createInterface } from '@lido-nestjs/di';

export const LidoKeyValidatorInterface =
  createInterface<LidoKeyValidatorInterface>('LidoKeyValidatorInterface');

export interface LidoKeyValidatorInterface {
  validateKey<T>(key: LidoKey & T): Promise<[Key & LidoKey & T, boolean]>;
  validateKeys<T>(
    keys: (LidoKey & T)[],
  ): Promise<[Key & LidoKey & T, boolean][]>;
}
