import * as path from 'path';
import { validateOneKey } from '../common/validate-one-key';
import { Key } from '../interfaces';
import { deserialize } from './serialize';

const worker = <T extends Key>(
  keysPartSerialized: [serializedKey: string, index: number][],
): [index: number, valid: boolean][] => {
  const keysDataBatch = keysPartSerialized.map((data) => {
    return {
      index: data[1],
      key: deserialize<T>(data[0]),
    };
  });

  return keysDataBatch.map((data) => {
    return [
      data.index,
      validateOneKey(
        data.key.key,
        data.key.depositSignature,
        data.key.withdrawalCredentials,
        data.key.genesisForkVersion,
        data.key.amount,
        data.key.domainDeposit,
        data.key.zeroHash,
      ),
    ];
  });
};

/* istanbul ignore next */
worker.filename = process.env.TS_JEST
  ? path.resolve(__dirname, '../../dist/worker/key-validator.worker.js')
  : path.resolve(__dirname, '../worker/key-validator.worker.js');

export default worker;
