import { KeyValidatorExecutorInterface, Key } from '../interfaces';
import { validateOneKey } from '../common/validate-one-key';

export class SingleThreadedKeyValidatorExecutor
  implements KeyValidatorExecutorInterface
{
  public async validateKey<T = never>(key: Key & T): Promise<boolean> {
    return validateOneKey(
      key.key,
      key.depositSignature,
      key.withdrawalCredentials,
      key.genesisForkVersion,
      key.amount,
      key.domainDeposit,
      key.zeroHash,
    );
  }

  public async validateKeys<T = never>(
    keys: (Key & T)[],
  ): Promise<[Key & T, boolean][]> {
    return Promise.all(
      keys.map(async (key) => [key, await this.validateKey(key)]),
    );
  }
}
