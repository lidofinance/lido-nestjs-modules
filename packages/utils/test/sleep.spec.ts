import { sleep, withTimer } from '../src';

describe('sleep', () => {
  test('should work', async () => {
    const [res, time] = await withTimer(async () => await sleep(1000));

    expect(res).toBeUndefined();
    expect(time).toBeGreaterThan(0.9);
    expect(time).toBeLessThan(1.1);
  });
});
