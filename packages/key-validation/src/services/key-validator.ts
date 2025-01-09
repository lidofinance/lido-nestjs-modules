import { Injectable } from '@nestjs/common';
import {
  KeyValidatorExecutorInterface,
  KeyValidatorInterface,
  Key,
} from '../interfaces';
import { ImplementsAtRuntime } from '@lido-nestjs/di';

@Injectable()
@ImplementsAtRuntime(KeyValidatorInterface)
export class KeyValidator implements KeyValidatorInterface {
  public constructor(public readonly executor: KeyValidatorExecutorInterface) {}

  public async validateKey<T>(key: Key & T): Promise<boolean> {
    return this.executor.validateKey(key);
  }

  public async validateKeys<T>(
    keys: (Key & T)[],
  ): Promise<[Key & T, boolean][]> {
    if (keys.length === 0) {
      return [];
    }

    return this.executor.validateKeys(keys);
  }
}
