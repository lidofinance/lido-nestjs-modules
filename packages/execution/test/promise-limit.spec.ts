/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import pLimit from '../src/common/promise-limit';
import { randomInt, sleep, timeMeasurer } from './utils';

type ValueDelayTuple = [number, number];

describe('Promise limit. ', () => {
  test('should be sequential, when concurrency is 1', async () => {
    const concurrency = 1;
    const input: ValueDelayTuple[] = [
      [10, 500],
      [20, 250],
      [30, 150],
    ];

    const end = timeMeasurer();
    const limit = pLimit(concurrency);

    const action = ([value, ms]: ValueDelayTuple) =>
      limit(async () => {
        await sleep(ms);
        return value;
      });

    const result = await Promise.all(input.map((x) => action(x)));
    const elapsed = end();

    expect(result).toStrictEqual([10, 20, 30]);
    expect(elapsed.ms).toBeGreaterThan(890);
    expect(elapsed.ms).toBeLessThan(950);
  });

  test('should work when concurrency is 4', async () => {
    const concurrency = 5;
    let running = 0;

    const limit = pLimit(concurrency);

    const input = Array.from({ length: 100 }, () =>
      limit(async () => {
        running++;
        expect(running).toBeLessThanOrEqual(concurrency);
        await sleep(randomInt(30, 200));
        running--;
      }),
    );

    await Promise.all(input);
  });

  test('should support non-promise returning function', async () => {
    await expect(async () => {
      const limit = pLimit(1);
      const result = await limit(() => 42);

      expect(result).toBe(42);
    }).not.toThrowError();
  });

  test('should continue execution after throw when concurrency is 1, and return all results', async () => {
    const limit = pLimit(1);
    let ran = false;

    const promises = [
      limit(() => {
        throw new Error('err');
      }),
      limit(() => {
        ran = true;
        return 42;
      }),
    ];

    const results = await Promise.allSettled(promises);

    expect(ran).toBe(true);
    expect(results.length).toBe(2);

    expect(results[0]).toHaveProperty('status');
    expect(results[0]).toHaveProperty('reason');
    expect(results[0].status).toBe('rejected');
    expect((<PromiseRejectedResult>results[0]).reason).toBeInstanceOf(Error);

    expect(results[1]).toHaveProperty('status');
    expect(results[1]).toHaveProperty('value');
    expect(results[1].status).toBe('fulfilled');
    expect((<PromiseFulfilledResult<number>>results[1]).value).toBe(42);
  });

  test('should accept additional arguments', async () => {
    const limit = pLimit(1);
    const symbol = Symbol('test');

    await limit((a) => expect(a).toBe(symbol), symbol);
  });

  test('should do clearQueue', async () => {
    const limit = pLimit(1);

    Array.from({ length: 1 }, () => limit(() => sleep(1000)));
    Array.from({ length: 3 }, () => limit(() => sleep(1000)));

    await Promise.resolve(); // forcing microtask execution
    expect(limit.pendingCount).toBe(3);
    limit.clearQueue();
    expect(limit.pendingCount).toBe(0);
  });

  test('should throw on invalid concurrency parameter', async () => {
    expect(() => pLimit(0)).toThrow();
    expect(() => pLimit(-1)).toThrow();
    expect(() => pLimit(1.2)).toThrow();
    expect(() => pLimit(<any>undefined)).toThrow();
    expect(() => pLimit(<any>true)).toThrow();
    expect(() => pLimit(<any>{})).toThrow();
    expect(() => pLimit(<any>[])).toThrow();
    expect(() => pLimit(<any>[])).toThrow();
  });

  test('should calculate activeCount and pendingCount properties', async () => {
    const limit = pLimit(5);
    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(0);

    const runningPromise1 = limit(() => sleep(1000));
    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(1);

    await Promise.resolve(); // forcing microtasks
    expect(limit.activeCount).toBe(1);
    expect(limit.pendingCount).toBe(0);

    await runningPromise1;
    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(0);

    const immediatePromises = Array.from({ length: 5 }, () =>
      limit(() => sleep(1000)),
    );
    const delayedPromises = Array.from({ length: 3 }, () =>
      limit(() => sleep(1000)),
    );

    await Promise.resolve(); // forcing microtasks
    expect(limit.activeCount).toBe(5);
    expect(limit.pendingCount).toBe(3);

    await Promise.all(immediatePromises);
    expect(limit.activeCount).toBe(3);
    expect(limit.pendingCount).toBe(0);

    await Promise.all(delayedPromises);

    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(0);
  });
});
