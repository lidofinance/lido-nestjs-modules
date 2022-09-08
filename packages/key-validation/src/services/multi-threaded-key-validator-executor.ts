import path from 'path';
import { Key, KeyValidatorExecutorInterface } from '../interfaces';
import { partition } from '@lido-nestjs/utils';
import Piscina from 'piscina';
import worker from '../worker/key-validator.worker';

export class MultiThreadedKeyValidatorExecutor
  implements KeyValidatorExecutorInterface
{
  public async validateKey<T = never>(key: Key & T): Promise<boolean> {
    return worker([key])[0][1];
  }

  public async validateKeys<T = never>(
    keys: (Key & T)[],
  ): Promise<[Key & T, boolean][]> {
    /* istanbul ignore next */
    const filename = process.env.TS_JEST
      ? path.resolve(__dirname, '../../dist/worker/key-validator.worker.js')
      : path.resolve(__dirname, './worker/key-validator.worker.js');

    const threadPool = new Piscina({
      filename: filename,
    });

    const partitions = partition(keys, threadPool.threads.length, 100);

    const result: [Key & T, boolean][][] = await Promise.all(
      partitions.map((keysPart: (Key & T)[]) => threadPool.run(keysPart)),
    );

    await threadPool.destroy();

    return result.flat();
  }
}
