/* eslint-disable @typescript-eslint/no-explicit-any */
import { MemoizeInFlightPromise, sleep, withTimer } from '../src';

describe('DebouncePromise decorator', () => {
  test('should work for non-async method (does not do anything)', async () => {
    const jestMock = jest.fn();

    class Foo {
      $value = 42;

      @MemoizeInFlightPromise()
      getValueSync(multiplier: number, extra = 2) {
        jestMock();
        return this.$value * multiplier + extra;
      }
    }

    const foo = new Foo();

    expect(foo.getValueSync(1, 0)).toBe(42);
    expect(foo.getValueSync(1, 0)).toBe(42);

    expect(foo.getValueSync(10, 0)).toBe(420);
    expect(foo.getValueSync(10)).toBe(422);
    expect(foo.getValueSync(10, 10)).toBe(430);

    foo.$value = 0;
    expect(foo.getValueSync(1)).toBe(2);
    expect(foo.getValueSync(1)).toBe(2);
    expect(jestMock).toBeCalledTimes(7);
  });

  test('should work for non-async getter (does not do anything)', async () => {
    const jestMock = jest.fn();
    class Foo {
      $value = 42;

      @MemoizeInFlightPromise()
      get value() {
        jestMock();
        return this.$value;
      }
    }

    const foo = new Foo();

    expect(foo.value).toBe(42);
    expect(foo.value).toBe(42);

    foo.$value = 0;
    expect(foo.value).toBe(0);
    expect(foo.value).toBe(0);
    expect(jestMock).toBeCalledTimes(4);
  });

  test('should work for async method', async () => {
    const jestMock = jest.fn();
    class Foo {
      $value = 42;

      @MemoizeInFlightPromise()
      async getValueAsync(multiplier: number, extra = 2) {
        await sleep(10);
        jestMock();
        return this.$value * multiplier + extra;
      }
    }

    const foo = new Foo();

    expect(await foo.getValueAsync(1, 0)).toBe(42);
    expect(await foo.getValueAsync(1, 0)).toBe(42);

    expect(await foo.getValueAsync(10, 0)).toBe(420);
    expect(await foo.getValueAsync(10)).toBe(422);
    expect(await foo.getValueAsync(10, 10)).toBe(430);

    foo.$value = 0;
    expect(await foo.getValueAsync(1)).toBe(2);
    expect(await foo.getValueAsync(1)).toBe(2);
    expect(jestMock).toBeCalledTimes(7);
  });

  test('should work for async getter', async () => {
    class Foo {
      $value = 42;

      @MemoizeInFlightPromise()
      get value() {
        return sleep(10).then(() => this.$value);
      }
    }

    const foo = new Foo();

    expect(await foo.value).toBe(42);
    expect(await foo.value).toBe(42);

    foo.$value = 0;
    expect(await foo.value).toBe(0);
    expect(await foo.value).toBe(0);
  });

  test('should work for async method and debounce promise with same arguments', async () => {
    const jestMock = jest.fn();

    class Foo {
      $value = 42;

      @MemoizeInFlightPromise()
      async getValueAsync(multiplier: number, extra = 2) {
        await sleep(2000);
        jestMock();
        return this.$value * multiplier + extra;
      }
    }

    const foo = new Foo();

    const [res, time] = await withTimer(
      async () =>
        await Promise.all([
          foo.getValueAsync(10),
          foo.getValueAsync(10),
          foo.getValueAsync(10),
        ]),
    );

    expect(res).toStrictEqual([422, 422, 422]);
    expect(time).toBeLessThan(2.1);
    expect(jestMock).toBeCalledTimes(1);
  });

  test('should work for async method and debounce promise with different arguments', async () => {
    const jestMock = jest.fn();

    class Foo {
      $value = 42;

      @MemoizeInFlightPromise()
      async getValueAsync(multiplier: number, extra = 2) {
        await sleep(2000);
        jestMock();
        return this.$value * multiplier + extra;
      }
    }

    const foo = new Foo();

    const [res, time] = await withTimer(
      async () =>
        await Promise.all([
          foo.getValueAsync(10),
          foo.getValueAsync(100),
          foo.getValueAsync(10),
          foo.getValueAsync(100),
        ]),
    );

    expect(res).toStrictEqual([422, 4202, 422, 4202]);
    expect(time).toBeLessThan(4.1);
    expect(jestMock).toBeCalledTimes(2);
  });

  test('should throw exception when applied to properties', async () => {
    const decorator: any = MemoizeInFlightPromise();

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Foo {
        @decorator
        public value = 2;
      }
    }).rejects.toThrow(
      `MemoizeInFlightPromise() decorator can be applied to a method or get accessor only`,
    );
  });
});
