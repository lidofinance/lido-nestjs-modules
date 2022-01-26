import { Test } from '@nestjs/testing';
import { MiddlewareModule, MiddlewareService } from '../src';

describe('Module initializing', () => {
  describe('For root', () => {
    let middlewareService: MiddlewareService<void>;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [MiddlewareModule.forRoot()],
      }).compile();

      middlewareService = await moduleRef.resolve(MiddlewareService);
    });

    test('Methods should be defined', async () => {
      expect(middlewareService.go).toBeDefined();
      expect(middlewareService.use).toBeDefined();
    });
  });

  describe('For feature', () => {
    let middlewareService: MiddlewareService<void>;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [MiddlewareModule.forFeature()],
      }).compile();

      middlewareService = await moduleRef.resolve(MiddlewareService);
    });

    test('Methods should be defined', async () => {
      expect(middlewareService.go).toBeDefined();
      expect(middlewareService.use).toBeDefined();
    });
  });

  describe('Initial middlewares', () => {
    const mockCallback = jest.fn();
    let middlewareService: MiddlewareService<void>;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          MiddlewareModule.forFeature({
            middlewares: [
              (next) => {
                mockCallback();
                return next();
              },
            ],
          }),
        ],
      }).compile();

      middlewareService = await moduleRef.resolve(MiddlewareService);
    });

    test('Middleware call', async () => {
      expect(mockCallback).toBeCalledTimes(0);
      middlewareService.go(() => void 0);
      expect(mockCallback).toBeCalledTimes(1);
    });
  });
});
