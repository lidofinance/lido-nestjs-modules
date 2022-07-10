/* eslint-disable @typescript-eslint/no-var-requires */
import { CHAINS } from '@lido-nestjs/constants';
import { currentWC, usedValidKeys as batchUsedKeys100 } from './keys';
import { range, withTimer } from './utils';
import { GENESIS_FORK_VERSION, KeyWithWC, validateKeys } from '../src';

describe('validateKeys function', () => {
  const forkVersion: Buffer =
    GENESIS_FORK_VERSION[CHAINS.Mainnet] ?? Buffer.of(0);

  test('should validate empty array immediately', async () => {
    const [res, time] = await withTimer(() => validateKeys([], forkVersion));

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('should benchmark 10k keys single-threaded', async () => {
    const keys: KeyWithWC[] = range(0, 100)
      .map(() => batchUsedKeys100)
      .flat(1)
      .map((key) => ({ ...key, wc: currentWC }));

    const [res, time] = await withTimer(() =>
      validateKeys(keys, forkVersion, { multithreaded: false }),
    );

    expect(res.length).toBe(10000);
    expect(time).toBeLessThan(60); // 60 seconds
  });

  test('should benchmark 10k keys multi-threaded', async () => {
    const keys: KeyWithWC[] = range(0, 100)
      .map(() => batchUsedKeys100)
      .flat(1)
      .map((key) => ({ ...key, wc: currentWC }));

    const [res, time] = await withTimer(() =>
      validateKeys(keys, forkVersion, { multithreaded: true }),
    );

    expect(res.length).toBe(10000);
    expect(time).toBeLessThan(10); // 10 seconds
  });
});
