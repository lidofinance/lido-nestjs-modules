import { loop, LoopError, wait } from '../../src/utils/loop.utils';

describe('Loop util', () => {
  const mockCallback = jest.fn();

  afterEach(() => {
    mockCallback.mockReset();
  });

  test('call once', async () => {
    const unbind = loop(1, () => {
      unbind();
      mockCallback('once');
    });
    await wait(100);
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toBe('once');
  });

  test('out of timeout Error', async () => {
    const unbind = loop(
      1,
      async () => {
        unbind();
        await wait(100);
      },
      (error) => expect(error.message).toBe('timeout loop error'),
      2,
    );

    await wait(200);

    expect.assertions(1);
  });

  test('without timeout Error', async () => {
    const errors: LoopError[] = [];
    const unbind = loop(
      1,
      async () => {
        unbind();
        await wait(100);
      },
      (error) => errors.push(error),
      200,
    );

    await wait(300);

    expect(errors).toHaveLength(0);
  });

  test('block parallel iterations', async () => {
    const errors: LoopError[] = [];
    let count = 0;
    const unbind = loop(
      1,
      async () => {
        count++;
        await wait(100);
      },
      (error) => errors.push(error),
    );

    await wait(300);
    unbind();

    expect(errors).toHaveLength(0);
    expect(count).toBeLessThanOrEqual(5);
  });
});
