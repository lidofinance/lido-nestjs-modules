import { withTimer } from '../src';

describe('withTimer', () => {
  test('should return measured time and result for operation', async () => {
    const operation = (timeout: number, result: string) =>
      new Promise((resolve) => setTimeout(() => resolve(result), timeout));

    const [res, time] = await withTimer(() => operation(1000, 'hello'));

    expect(res).toEqual('hello');
    expect(time).toBeGreaterThanOrEqual(1);
    expect(time).toBeLessThan(1.2);
  });
});
