import { Key } from './common';
import { createInterface } from '@lido-nestjs/di';

export const KeyValidatorExecutorInterface =
  createInterface<KeyValidatorExecutorInterface>(
    'KeyValidatorExecutorInterface',
  );

/**
 * Executor that actually performs key-validation.
 * Does not store any state or data.
 */
export interface KeyValidatorExecutorInterface {
  validateKey<T = never>(key: Key & T): Promise<boolean>;
  validateKeys<T = never>(keys: (Key & T)[]): Promise<[Key & T, boolean][]>;
}
