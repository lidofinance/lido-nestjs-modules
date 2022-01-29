import { retrier } from '../src/common/retrier';
import { sleep } from '../src/common/sleep';

describe('Retrier. ', () => {
  test('should perform basic retry functionality', async () => {
    const retry = retrier();

    let attempts = 0;
    const successOn = 2;
    const doSomeWork = async () => {
      await sleep(10);
      attempts++;
      if (attempts < successOn) {
        throw new Error('Not ready yet');
      }

      return 'yay';
    };

    const result = await retry(doSomeWork);

    expect(result).toBe('yay');
    expect(attempts).toBe(2);
  });
});
