import os from 'os';
import path from 'path';
import { KeyWithWC, Pubkey } from '../interfaces/common';
import { partition } from './partition';
import Piscina from 'piscina';
import worker from '../worker/key-validator.worker';

export const validateKeys = async (
  keys: KeyWithWC[],
  genesisForkVersion: Buffer,
  options?: { multithreaded: boolean },
): Promise<[Pubkey, boolean][]> => {
  if (options?.multithreaded) {
    const partitions = partition(keys, os.cpus().length, 100);

    /* istanbul ignore next */
    const filename = process.env.TS_JEST
      ? path.resolve(__dirname, '../../dist/worker/key-validator.worker.js')
      : path.resolve(__dirname, '../worker/key-validator.worker.js');

    const threadPool = new Piscina({
      filename: filename,
    });

    const result = await Promise.all(
      partitions.map((keysPart) =>
        threadPool.run({ keys: keysPart, genesisForkVersion }),
      ),
    );

    await threadPool.destroy();

    return result.reduce((acc, x) => [...acc, ...x], []);
  }

  return worker({ keys, genesisForkVersion });
};
