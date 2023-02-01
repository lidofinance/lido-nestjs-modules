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

  test('Middlewares with context', () => {
    const mockCallback = jest.fn();

    middlewareService.use((next, ctx) => {
      mockCallback(ctx.foo);
      return next();
    });

    const context = { foo: 'bar' };
    middlewareService.go(() => mockCallback('main'), context);

    expect(mockCallback).toBeCalledTimes(2);
    expect(mockCallback.mock.calls[0][0]).toBe('bar');
    expect(mockCallback.mock.calls[1][0]).toBe('main');
  });

  test('Return value', async () => {
    const expected = 42;
    const mockCallback = jest.fn().mockReturnValue(expected);

    const result = middlewareService.go(() => mockCallback());
    expect(result).toBe(expected);
  });
});
