/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  BatchProviderModule,
  BatchProviderModuleAsyncOptions,
  ExtendedJsonRpcBatchProvider,
  FallbackProviderModule,
  FallbackProviderModuleAsyncOptions,
  RequestPolicy,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import {
  DynamicModule,
  Injectable,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { sleep } from './utils';

@Injectable()
class DummyAsyncOptionsService {
  public maxRetries = 3;
  public url = 'localhost';
  public urls: [string] = ['localhost'];
  public network = 1;
  public requestPolicy: RequestPolicy = {
    jsonRpcMaxBatchSize: 30,
    maxConcurrentRequests: 2,
    batchAggregationWaitMs: 10,
  };
}
@Module({
  providers: [
    {
      provide: DummyAsyncOptionsService,
      useFactory: async () => {
        const service = new DummyAsyncOptionsService();
        await sleep(10);
        return service;
      },
    },
  ],
  exports: [DummyAsyncOptionsService],
})
class TestAsyncModule {
  static forRoot(): DynamicModule {
    return {
      module: TestAsyncModule,
      global: true,
    };
  }
}

describe('Async module initializing', () => {
  describe('FallbackProviderModule', () => {
    const testModules = async (imports: ModuleMetadata['imports']) => {
      const moduleRef = await Test.createTestingModule({ imports }).compile();

      const dummyAsyncOptionsService = await moduleRef.resolve(
        DummyAsyncOptionsService,
      );
      const fallbackProvider = await moduleRef.resolve(
        SimpleFallbackJsonRpcBatchProvider,
      );

      expect(fallbackProvider).toBeInstanceOf(
        SimpleFallbackJsonRpcBatchProvider,
      );
      expect((<any>fallbackProvider).config.maxRetries).toBe(
        dummyAsyncOptionsService.maxRetries,
      );
      expect((<any>fallbackProvider).config.urls).toBe(
        dummyAsyncOptionsService.urls,
      );
      expect((<any>fallbackProvider).config.network).toBe(
        dummyAsyncOptionsService.network,
      );
    };

    const factory: Pick<
      FallbackProviderModuleAsyncOptions,
      'useFactory' | 'inject'
    > = {
      useFactory: async (service: DummyAsyncOptionsService) => {
        return {
          ...service,
        };
      },
      inject: [DummyAsyncOptionsService],
    };

    test('forRootAsync', async () => {
      await testModules([
        LoggerModule.forRoot({ transports: [nullTransport()] }),
        TestAsyncModule.forRoot(),
        FallbackProviderModule.forRootAsync(factory),
      ]);

      await testModules([
        FallbackProviderModule.forRootAsync({
          imports: [
            TestAsyncModule.forRoot(),
            LoggerModule.forRoot({ transports: [nullTransport()] }),
          ],
          ...factory,
        }),
      ]);
    });

    test('forFeatureAsync', async () => {
      await testModules([
        LoggerModule.forRoot({ transports: [nullTransport()] }),
        TestAsyncModule.forRoot(),
        FallbackProviderModule.forFeatureAsync(factory),
      ]);

      await testModules([
        FallbackProviderModule.forFeatureAsync({
          imports: [
            TestAsyncModule.forRoot(),
            LoggerModule.forRoot({ transports: [nullTransport()] }),
          ],
          ...factory,
        }),
      ]);
    });
  });

  describe('BatchProviderModule', () => {
    const testModules = async (imports: ModuleMetadata['imports']) => {
      const moduleRef = await Test.createTestingModule({ imports }).compile();

      const dummyAsyncOptionsService = await moduleRef.resolve(
        DummyAsyncOptionsService,
      );
      const extendedJsonRpcBatchProvider = await moduleRef.resolve(
        ExtendedJsonRpcBatchProvider,
      );

      expect(extendedJsonRpcBatchProvider).toBeInstanceOf(
        ExtendedJsonRpcBatchProvider,
      );
      expect(
        (<any>extendedJsonRpcBatchProvider)._requestPolicy
          .maxConcurrentRequests,
      ).toBe(dummyAsyncOptionsService.requestPolicy.maxConcurrentRequests);
      expect((<any>extendedJsonRpcBatchProvider).connection.url).toBe(
        dummyAsyncOptionsService.url,
      );
    };

    const factory: Pick<
      BatchProviderModuleAsyncOptions,
      'useFactory' | 'inject'
    > = {
      useFactory: async (service: DummyAsyncOptionsService) => {
        return {
          ...service,
        };
      },
      inject: [DummyAsyncOptionsService],
    };

    test('forRootAsync', async () => {
      await testModules([
        LoggerModule.forRoot({ transports: [nullTransport()] }),
        TestAsyncModule.forRoot(),
        BatchProviderModule.forRootAsync(factory),
      ]);

      await testModules([
        BatchProviderModule.forRootAsync({
          imports: [
            TestAsyncModule.forRoot(),
            LoggerModule.forRoot({ transports: [nullTransport()] }),
          ],
          ...factory,
        }),
      ]);
    });

    test('forFeatureAsync', async () => {
      await testModules([
        LoggerModule.forRoot({ transports: [nullTransport()] }),
        TestAsyncModule.forRoot(),
        BatchProviderModule.forFeatureAsync(factory),
      ]);

      await testModules([
        BatchProviderModule.forFeatureAsync({
          imports: [
            TestAsyncModule.forRoot(),
            LoggerModule.forRoot({ transports: [nullTransport()] }),
          ],
          ...factory,
        }),
      ]);
    });
  });
});
