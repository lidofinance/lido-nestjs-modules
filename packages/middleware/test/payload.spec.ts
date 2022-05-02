import { Test } from '@nestjs/testing';
import { MiddlewareModule, MiddlewareService } from '../src';

type Cb<P> = (payload: P) => Cb<P>;

type LocalPayload = { test: number };

describe('Middleware', () => {
  let middlewareService: MiddlewareService<Cb<LocalPayload>, LocalPayload>;

  beforeEach(async () => {
    const middlewareModule = MiddlewareModule.forRoot();
    const testModule = { imports: [middlewareModule] };
    const moduleRef = await Test.createTestingModule(testModule).compile();

    middlewareService = await moduleRef.resolve(MiddlewareService);
  });

  test('Base', async () => {
    const mockCallback = jest.fn();
    middlewareService.go(() => mockCallback(), { test: 1 });

    expect(mockCallback).toBeCalledTimes(1);
  });

  test('Middlewares', async () => {
    const mockCallback = jest.fn();

    middlewareService.use((next, payload) => {
      mockCallback(payload?.test);
      if (payload?.test) payload.test += 1;
      return next(payload);
    });

    middlewareService.use((next, payload) => {
      mockCallback(payload?.test);
      if (payload?.test) payload.test += 1;
      return next(payload);
    });

    middlewareService.use((next, payload) => {
      mockCallback(payload?.test);
      if (payload?.test) payload.test += 1;
      return next(payload);
    });

    middlewareService.go((payload) => mockCallback(payload?.test), { test: 1 });

    expect(mockCallback.mock.calls[0][0]).toBe(1);
    expect(mockCallback.mock.calls[1][0]).toBe(2);
    expect(mockCallback.mock.calls[2][0]).toBe(3);
    expect(mockCallback.mock.calls[3][0]).toBe(4);
  });
});
