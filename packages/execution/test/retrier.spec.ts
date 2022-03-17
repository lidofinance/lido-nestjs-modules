import 'reflect-metadata';
import { retrier } from '../src/common/retrier';
import { sleep } from '../src/common/sleep';
import { timeMeasurer } from './utils';
import { LoggerService } from '@nestjs/common';

describe('Retrier. ', () => {
  let attempts = 0;
  let successOn = 2;
  const doSomeWork = async () => {
    attempts++;
    await sleep(10);
    if (attempts <= successOn) {
      throw new Error(`Not ready yet, attempt ${attempts}`);
    }

    return 'yay';
  };

  beforeEach(async () => {
    attempts = 0;
  });

  test('should perform basic retry functionality', async () => {
    const retry = retrier();
    successOn = 2;
    const result = await retry(doSomeWork);

    expect(result).toBe('yay');
    expect(attempts).toBe(3);
  });

  test('should fail when retry count reached', async () => {
    const retry = retrier(null, 2);
    successOn = 4;
    await expect(async () => await retry(doSomeWork)).rejects.toThrow(
      'Not ready yet, attempt 2',
    );
    expect(attempts).toBe(2);
  });

  test('should do exponential backoff', async () => {
    const retry = retrier(null, 5, 250, 2000);
    successOn = 3;

    const end = timeMeasurer();
    const result = await retry(doSomeWork);
    const elapsed = end();

    expect(elapsed.ms).toBeGreaterThan(1700);
    expect(elapsed.ms).toBeLessThan(1900);
    expect(result).toBe('yay');
    expect(attempts).toBe(4);
  });

  test('should accept non-promise functions', async () => {
    const retry = retrier(null, 10, 250, 2000);

    let attempts = 0;
    const successOn = 2;
    const doSomeSyncWork = async () => {
      attempts++;
      if (attempts < successOn) {
        throw new Error('Not ready yet');
      }

      return 'yay';
    };
    const result = await retry(doSomeSyncWork);

    expect(result).toBe('yay');
    expect(attempts).toBe(2);
  });

  test('should work with logger', async () => {
    const logger: LoggerService = <LoggerService>{
      warn: (message: unknown) => {
        return message;
      },
    };
    const loggerMock = jest.spyOn(logger, 'warn');

    const retry = retrier(logger, 5, 10, 1000, true);
    successOn = 2;

    const result = await retry(doSomeWork);
    expect(result).toBe('yay');
    expect(loggerMock).toBeCalledTimes(2);
  });

  test('should fail after N default attempts', () => {
    // TODO
  });

  test('should fail after M overridden, and N default attempts', () => {
    // TODO
  });

  test('should fail after N default max backoff', () => {
    // TODO
  });

  test('should fail after M overridden, and N default max backoff', () => {
    // TODO
  });

  test('should support error default filter', async () => {
    const errorFilter = (error: Error | unknown): boolean => {
      return (
        error instanceof Error && error.message === 'Not ready yet, attempt 2'
      );
    };
    const retry = retrier(undefined, 5, 100, 1000, false, errorFilter);
    successOn = 5;

    await expect(async () => await retry(doSomeWork)).rejects.toThrow(
      'Not ready yet, attempt 2',
    );

    expect(attempts).toBe(2);
  });

  test('should support error specific filter', async () => {
    const errorFilter = (error: Error | unknown): boolean => {
      return (
        error instanceof Error && error.message === 'Not ready yet, attempt 2'
      );
    };
    const retry = retrier(undefined, 5, 100, 1000, false);
    successOn = 5;

    await expect(
      async () =>
        await retry(
          doSomeWork,
          undefined,
          undefined,
          undefined,
          undefined,
          errorFilter,
        ),
    ).rejects.toThrow('Not ready yet, attempt 2');

    expect(attempts).toBe(2);
  });
});
