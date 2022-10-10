import { Key, KeyValidatorExecutorInterface } from '../interfaces';
import { partition } from '@lido-nestjs/utils';
import Piscina from 'piscina';
import { serialize } from '../worker/serialize';
import worker from '../worker/key-validator.worker';
import assert from 'assert';

export class MultiThreadedKeyValidatorExecutor
  implements KeyValidatorExecutorInterface
{
  public async validateKey<T = never>(key: Key & T): Promise<boolean> {
    const serialized = serialize(key);

    const result = worker([[serialized, 0]]);

    return result[0][1];
  }

  public async validateKeys<T = never>(
    keys: (Key & T)[],
  ): Promise<[Key & T, boolean][]> {
    const threadPool = new Piscina({
      filename: worker.filename,
    });

    type Runner = (
      task: Parameters<typeof worker>[0],
      options?: Parameters<typeof threadPool.run>[1],
    ) => Promise<ReturnType<typeof worker>>;

    const partitions = partition(keys, threadPool.threads.length, 100);

    const runner: Runner = threadPool.run;

    const results: [Key & T, boolean][][] = await Promise.all(
      partitions.map(async (partition) => {
        const partitionWithExtraData = partition.map((key, index) => {
          // index in each partition is used to find result for each key from workers
          return { key, serialized: serialize(key), index };
        });

        const dataToBeSentToWorker: [serializedKey: string, index: number][] =
          partitionWithExtraData.map((x) => [x.serialized, x.index]);

        const results = await runner.call(threadPool, dataToBeSentToWorker);

        const resultsWithOriginalKey: [Key & T, boolean][] =
          partitionWithExtraData.map((x) => {
            const result = results.find((s) => s[0] === x.index);
            // this will never happen
            assert(result, 'Empty key result found. Halting.');
            return [x.key, result[1]];
          });

        return resultsWithOriginalKey;
      }),
    );

    await threadPool.destroy();

    return results.flat();
  }
}
