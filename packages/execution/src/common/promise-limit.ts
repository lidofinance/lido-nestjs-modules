/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Queue } from './queue';

export interface LimitFunction {
  readonly activeCount: number;
  readonly pendingCount: number;
  clearQueue: () => void;
  <Arguments extends unknown[], ReturnType>(
    fn: (...args: Arguments) => PromiseLike<ReturnType> | ReturnType,
    ...args: Arguments
  ): Promise<ReturnType>;
}

export default function pLimit(concurrency: number): LimitFunction {
  if (
    !(
      (Number.isInteger(concurrency) ||
        concurrency === Number.POSITIVE_INFINITY) &&
      concurrency > 0
    )
  ) {
    throw new TypeError('Expected `concurrency` to be positive integer');
  }

  const queue = new Queue<Function>();
  let activeCount = 0;

  const next = () => {
    activeCount--;

    if (queue.length > 0) {
      const item = queue.dequeue();
      item && item();
    }
  };

  const run = async (fn: Function, resolve: any, args: any[]) => {
    activeCount++;

    const result = (async () => fn(...args))();

    resolve(result);

    try {
      await result;
    } catch {
      // should not catch exceptions here
      // exceptions should be caught in above handlers
    }

    next();
  };

  const enqueue = (fn: Function, resolve: any, args: any[]) => {
    queue.enqueue(run.bind(undefined, fn, resolve, args));

    (async () => {
      await Promise.resolve();

      if (activeCount < concurrency && queue.length > 0) {
        const item = queue.dequeue();
        item && item();
      }
    })();
  };

  const generator = (fn: Function, ...args: any[]) =>
    new Promise((resolve) => {
      enqueue(fn, resolve, args);
    });

  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount,
    },
    pendingCount: {
      get: () => queue.length,
    },
    clearQueue: {
      value: () => {
        queue.clear();
      },
    },
  });

  return <LimitFunction>(<unknown>generator);
}
