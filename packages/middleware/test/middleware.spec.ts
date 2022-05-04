/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test } from '@nestjs/testing';
import { MiddlewareModule, MiddlewareService } from '../src';

describe('Middleware', () => {
  let middlewareService: MiddlewareService<void>;

  beforeEach(async () => {
    const middlewareModule = MiddlewareModule.forRoot();
    const testModule = { imports: [middlewareModule] };
    const moduleRef = await Test.createTestingModule(testModule).compile();

    middlewareService = await moduleRef.resolve(MiddlewareService);
  });

  test('Base', async () => {
    const mockCallback = jest.fn();
    middlewareService.go(() => mockCallback());

    expect(mockCallback).toBeCalledTimes(1);
  });

  test('Middlewares', async () => {
    const mockCallback = jest.fn();

    middlewareService.use((next) => {
      mockCallback('first');
      return next();
    });

    middlewareService.use((next) => {
      mockCallback('second');
      return next();
    });

    middlewareService.go(() => mockCallback('main'));

    expect(mockCallback).toBeCalledTimes(3);
    expect(mockCallback.mock.calls[0][0]).toBe('first');
    expect(mockCallback.mock.calls[1][0]).toBe('second');
    expect(mockCallback.mock.calls[2][0]).toBe('main');
  });

  test('Middlewares from run', async () => {
    const mockCallback = jest.fn();

    middlewareService.run(
      [
        (next) => {
          mockCallback('first');
          return next();
        },
        (next) => {
          mockCallback('second');
          return next();
        },
      ],
      () => mockCallback('main'),
    );

    expect(mockCallback).toBeCalledTimes(3);
    expect(mockCallback.mock.calls[0][0]).toBe('first');
    expect(mockCallback.mock.calls[1][0]).toBe('second');
    expect(mockCallback.mock.calls[2][0]).toBe('main');
  });

  test('Return value', async () => {
    const expected = 42;
    const mockCallback = jest.fn().mockReturnValue(expected);

    const result = middlewareService.go(() => mockCallback());
    expect(result).toBe(expected);
  });

  test('Return value from run', async () => {
    const expected = { test: 42 };
    const mockCallback = jest.fn().mockReturnValue(expected);

    const result = middlewareService.run(
      [
        (next, payload) => {
          //@ts-ignore
          if (payload) payload.test = 11;
          return next();
        },
      ],
      (payload) => {
        return payload;
      },
      mockCallback(),
    );
    expect(result).toEqual({ test: 11 });
  });

  test('Try catch order', async () => {
    class MidError extends Error {}
    const middleware = () =>
      middlewareService.run(
        [
          async (next, payload) => {
            let res;
            try {
              res = await next();
            } catch (e) {
              // @ts-ignore
              expect(payload.test).toBe(11);
              throw new MidError('test');
            }
            return res;
          },
          async (next, payload) => {
            //@ts-ignore
            payload.test = 11;
            return next();
          },
          async () => {
            throw new Error('test');
          },
        ],
        (payload) => {
          return payload;
        },
        { test: 22 },
      );
    await expect(middleware()).rejects.toThrow(MidError);
    expect.assertions(2);
  });
});
