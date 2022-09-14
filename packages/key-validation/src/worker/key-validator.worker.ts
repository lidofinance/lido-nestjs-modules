import * as path from 'path';
import { validateOneKey } from '../common/validate-one-key';
import { Key } from '../interfaces';
import { deserialize, serialize } from './serialize';

const worker = <T extends Key>(keysPartSerialized: string[]): string[] => {
  const keys = keysPartSerialized.map((data) => deserialize<T>(data));

  const results: [Key & T, boolean][] = keys.map((key) => {
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

  return results.map(serialize);
};

/* istanbul ignore next */
worker.filename = process.env.TS_JEST
  ? path.resolve(__dirname, '../../dist/worker/key-validator.worker.js')
  : path.resolve(__dirname, '../worker/key-validator.worker.js');

export default worker;
