import { validateOneKey } from '../common/validate-one-key';
import { Key } from '../interfaces';

export default <T = never>(keys: (Key & T)[]): [Key & T, boolean][] => {
  return keys.map((key) => {
    return [
      key,
      validateOneKey(
        key.key,
        key.depositSignature,
        key.withdrawalCredentials,
        key.genesisForkVersion,
        key.amount,
        key.domainDeposit,
        key.zeroHash,
      ),
    ];
  });
};
