import { retrier } from '../src/common/retrier';
import { sleep } from '../src/common/sleep';
import { timeMeasurer } from './utils';

describe('Retrier. ', () => {
  test('should perform basic retry functionality', async () => {
    const retry = retrier();

    let attempts = 0;
    const successOn = 2;
    const doSomeWork = async () => {
      attempts++;
      await sleep(10);
      if (attempts <= successOn) {
        throw new Error('Not ready yet');
      }

      return 'yay';
    };

    const result = await retry(doSomeWork);

    expect(result).toBe('yay');
    expect(attempts).toBe(3);
  });

  test('should do exponential backoff', async () => {
    const retry = retrier(null, 5, 250, 2000);

    let attempts = 0;
    const successOn = 3;
    const doSomeWork = async () => {
      attempts++;
      await sleep(1);
      if (attempts <= successOn) {
        throw new Error('Not ready yet');
      }

      return 42;
    };

    const end = timeMeasurer();
    const result = await retry(doSomeWork);
    const elapsed = end();

    expect(elapsed.ms).toBeGreaterThan(1700);
    expect(elapsed.ms).toBeLessThan(1790);
    expect(result).toBe(42);
    expect(attempts).toBe(4);
  });

  test('shoudl accept non-promise functions', async () => {
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
});
