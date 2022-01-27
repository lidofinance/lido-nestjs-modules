import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  MiddlewareModule,
  MiddlewareModuleOptions,
  MiddlewareService,
} from '../src';

describe('Sync module initializing', () => {
  const mockCallback = jest.fn();

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const middlewareService = await moduleRef.resolve(MiddlewareService);

    expect(middlewareService.go).toBeDefined();
    expect(middlewareService.use).toBeDefined();

    return moduleRef;
  };

  const testWithConfig = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await testModules(imports);
    const middlewareService = await moduleRef.resolve(MiddlewareService);

    mockCallback.mockReset();

    expect(mockCallback).toBeCalledTimes(0);
    middlewareService.go(() => void 0);
    expect(mockCallback).toBeCalledTimes(1);
  };

  const options: MiddlewareModuleOptions<void> = {
    middlewares: [
      (next) => {
        mockCallback();
        return next();
      },
    ],
  };

  test('Module', async () => {
    await testModules([MiddlewareModule]);
  });

  test('forRoot', async () => {
    await testModules([MiddlewareModule.forRoot()]);
    await testWithConfig([MiddlewareModule.forRoot(options)]);
  });

  test('forFeature', async () => {
    await testModules([MiddlewareModule.forFeature()]);
    await testWithConfig([MiddlewareModule.forFeature(options)]);
  });
});
