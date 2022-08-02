import { KeyValidatorExecutorInterface } from '../interfaces/key-validator.executor.interface';
import { KeyWithWC, Pubkey } from '../interfaces/common';
import { DOMAIN_DEPOSIT, ZERO_HASH } from '../constants/constants';
import { validateKey } from '../common/validate-one';

export class SingleThreadedKeyValidatorExecutor implements KeyValidatorExecutorInterface {

  public async validateKey(
    key: KeyWithWC,
    genesisForkVersion: Buffer,
    amount: number = 32 * (10 ** 9),
    domainDeposit: Buffer = DOMAIN_DEPOSIT,
    zeroHash: Buffer = ZERO_HASH,
  ): Promise<boolean> {
    return validateKey(key, key.wc, genesisForkVersion, amount, domainDeposit, zeroHash);
  };

  public async validateKeys(
    keys: KeyWithWC[],
    genesisForkVersion: Buffer,
    amount?: number,
    domainDeposit?: Buffer,
    zeroHash?: Buffer
  ): Promise<[Pubkey, boolean][]> {
    return Promise.all(keys.map(async key => [key.key, await this.validateKey(key, genesisForkVersion, amount, domainDeposit, zeroHash)]));
  }
}
