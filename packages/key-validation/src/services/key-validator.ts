import { Injectable } from '@nestjs/common';
import { KeyWithWC, Pubkey, KeyValidatorExecutorInterface, KeyValidatorInterface } from '../interfaces';
import { ImplementsAtRuntime } from '@lido-nestjs/di';
import { DOMAIN_DEPOSIT, ZERO_HASH } from '../constants/constants';

@Injectable()
@ImplementsAtRuntime(KeyValidatorInterface)
export class KeyValidator implements KeyValidatorInterface {

  public constructor(
    private readonly executor: KeyValidatorExecutorInterface,
  ) {}

  public async validateKey(
    key: KeyWithWC,
    genesisForkVersion: Buffer,
    amount?: number,
    domainDeposit?: Buffer,
    zeroHash?: Buffer,
  ): Promise<boolean> {
    return this.executor.validateKey(key, genesisForkVersion, amount, domainDeposit, zeroHash);
  }

  public async validateKeys(
    keys: KeyWithWC[],
    genesisForkVersion: Buffer,
    amount: number = 32 * (10 ** 9),
    domainDeposit: Buffer = DOMAIN_DEPOSIT,
    zeroHash: Buffer = ZERO_HASH,
  ): Promise<[Pubkey, boolean][]> {
    if (keys.length === 0) {
      return [];
    }

    return this.executor.validateKeys(keys, genesisForkVersion, amount, domainDeposit, zeroHash);
  }
}
