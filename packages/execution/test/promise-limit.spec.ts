/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import pLimit from '../src/common/promise-limit';

const timeMeasurer = () => {
  const start = process.hrtime.bigint();
  return () => {
    const ns = process.hrtime.bigint() - start;
    return {
      ns,
      ms: Number(ns) / 1000000,
      sec: Number(ns) / 1000000000,
    };
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
  Math.ceil(min);

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

  test('non-promise returning function', async () => {
    await expect(async () => {
      const limit = pLimit(1);
      await limit(() => null);
    }).not.toThrowError();
  });

  test('continues execution after throw when concurrency is 1', async () => {
    const limit = pLimit(1);
    let ran = false;

    const promises = [
      limit(() => {
        throw new Error('err');
      }),
      limit(() => {
        ran = true;
      }),
    ];

    await Promise.all(promises).catch(() => {});

    expect(ran).toBe(true);
  });

  test('accepts additional arguments', async () => {
    const limit = pLimit(1);
    const symbol = Symbol('test');

    await limit((a) => expect(a).toBe(symbol), symbol);
  });

  test('clearQueue', async () => {
    const limit = pLimit(1);

    Array.from({ length: 1 }, () => limit(() => sleep(1000)));
    Array.from({ length: 3 }, () => limit(() => sleep(1000)));

    await Promise.resolve();
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

  test('activeCount and pendingCount properties', async () => {
    const limit = pLimit(5);
    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(0);

    const runningPromise1 = limit(() => sleep(1000));
    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(1);

    await Promise.resolve();
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

    await Promise.resolve();
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
