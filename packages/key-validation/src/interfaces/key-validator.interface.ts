import { Key, KeyWithWC, Pubkey, WithdrawalCredentialsBuffer } from './common';
import { createInterface } from '@lido-nestjs/di';

export const KeyValidatorInterface =
  createInterface<KeyValidatorInterface>('KeyValidatorInterface');

export interface KeyValidatorInterface {

  validateKey(
    key: KeyWithWC,
    genesisForkVersion: Buffer,
    amount?: number,
    domainDeposit?: Buffer,
    zeroHash?: Buffer,
  ): Promise<boolean>;

  validateKeys(
    keys: KeyWithWC[],
    genesisForkVersion: Buffer,
    amount?: number,
    domainDeposit?: Buffer,
    zeroHash?: Buffer
  ): Promise<[Pubkey, boolean][]>;
}
