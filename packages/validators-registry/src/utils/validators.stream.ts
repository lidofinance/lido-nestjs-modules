import { streamArray } from 'stream-json/streamers/StreamArray';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';

import { Validator } from '../types';
import { parseAsTypeOrFail } from './parse';
import { ConsensusDataInvalidError } from '../errors';
import { batch } from 'stream-json/utils/Batch';

function unblock() {
  // Unblock event loop in long loops
  // Source: https://snyk.io/blog/nodejs-how-even-quick-async-functions-can-block-the-event-loop-starve-io/
  return new Promise((resolve) => {
    return setImmediate(() => resolve(true));
  });
}

const BATCH_SIZE = 100;
export type ValidatorCallback = (validators: Validator[]) => Promise<void>;

export async function processValidatorsStream(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validatorsReadStream: any,
  callback: ValidatorCallback,
  batchSize = BATCH_SIZE,
) {
  const pipeline = chain([
    validatorsReadStream,
    parser(),
    pick({ filter: 'data' }),
    streamArray(),
    batch({ batchSize }),
    async (batch) => {
      await unblock();
      const chunk: Validator[] = [];
      for (const validator of batch) {
        /* istanbul ignore next */
        const parsedValidator = parseAsTypeOrFail(
          Validator,
          {
            pubkey: validator.value?.validator?.pubkey,
            index: validator.value?.index,
            status: validator.value?.status,
          },
          (error) => {
            throw new ConsensusDataInvalidError(
              `Got invalid validators`,
              error,
            );
          },
        );
        chunk.push(parsedValidator);
      }
      await callback([...chunk]);
    },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  pipeline.on('data', /* istanbul ignore next */ () => {});

  await new Promise((resolve, reject) => {
    pipeline.on('error', (error) => {
      reject(error);
    });

    pipeline.on('end', async () => {
      resolve(true);
    });
  }).finally(() => pipeline.destroy());
}
