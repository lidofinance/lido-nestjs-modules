import { Key, KeyValidatorExecutorInterface } from '../interfaces';
import { partition } from '@lido-nestjs/utils';
import Piscina from 'piscina';
import { deserialize, serialize } from '../worker/serialize';
import worker from '../worker/key-validator.worker';

export class MultiThreadedKeyValidatorExecutor
  implements KeyValidatorExecutorInterface
{
  public async validateKey<T = never>(key: Key & T): Promise<boolean> {
    const serialized = serialize(key);

    const result = worker([serialized]);

    return deserialize<[Key & T, boolean]>(result[0])[1];
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

    const results: string[][] = await Promise.all(
      partitions
        .map((keys) => keys.map(serialize))
        .map((keysPartSerialized: string[]) => {
          return runner.call(threadPool, keysPartSerialized);
        }),
    );

    await threadPool.destroy();

    // deserialization
    return results.flat().map((data) => deserialize<[Key & T, boolean]>(data));
  }
}
