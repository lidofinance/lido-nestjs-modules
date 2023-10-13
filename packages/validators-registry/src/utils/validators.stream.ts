import { streamArray } from 'stream-json/streamers/StreamArray';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
// import { Readable } from 'stream';
import { Validator } from '../types';
import { parseAsTypeOrFail } from './parse';
import { ConsensusDataInvalidError } from '../errors';
import { batch } from 'stream-json/utils/Batch';

// export async function validateStreamStructure(
//   validatorsReadStream: Readable,
// ): Promise<boolean> {
//   let hasValidStructure = false;

//   const checkPipeline = chain([
//     validatorsReadStream,
//     parser(),
//     pick({ filter: 'data' }),
//     streamArray(),
//     (data) => {
//       if (Array.isArray(data.value)) {
//         hasValidStructure = true;
//       }
//     },
//   ]);

//   await new Promise((resolve, reject) => {
//     checkPipeline.on('error', reject);
//     checkPipeline.on('end', resolve);
//   }).finally(() => checkPipeline.destroy());

//   return hasValidStructure;
// }

function unblock() {
  // Unblock event loop in long loops
  // Source: https://snyk.io/blog/nodejs-how-even-quick-async-functions-can-block-the-event-loop-starve-io/
  return new Promise((resolve) => {
    return setImmediate(() => resolve(true));
  });
}

export type ValidatorCallback = (validators: Validator[]) => Promise<void>;

export async function processValidatorsStream(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validatorsReadStream: any,
  callback: ValidatorCallback,
) {
  const chunk: Validator[] = [];
  const pipeline = chain([
    validatorsReadStream,
    parser(),
    pick({ filter: 'data' }),
    streamArray(),
    batch({ batchSize: 100 }),
    async (batch) => {
      await unblock();
      const chunk: Validator[] = [];
      for (const validator of batch) {
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

  pipeline.on('data', (data) => {
    data;
  });

  await new Promise((resolve, reject) => {
    pipeline.on('error', (error) => {
      reject(error);
    });

    pipeline.on('end', async () => {
      if (chunk.length > 0) {
        callback([...chunk]);
      }
      resolve(true);
    });
  }).finally(() => pipeline.destroy());
}
