import { KeyWithWC, Pubkey } from './common';
import { createInterface } from '@lido-nestjs/di';

export const KeyValidatorExecutorInterface =
  createInterface<KeyValidatorExecutorInterface>('KeyValidatorExecutorInterface');

export interface KeyValidatorExecutorInterface {
  validateKey(
    key: KeyWithWC,
    genesisForkVersion: Buffer,
    amount?: number,
    domainDeposit?: Buffer,
    zeroHash?: Buffer
  ): Promise<boolean>;

  validateKeys(
    keys: KeyWithWC[],
    genesisForkVersion: Buffer,
    amount?: number,
    domainDeposit?: Buffer,
    zeroHash?: Buffer
  ): Promise<[Pubkey, boolean][]>;
}
