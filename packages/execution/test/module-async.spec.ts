/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  ExecutionModule,
  ExecutionModuleAsyncOptions,
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
  public urls: [string] = ['localhost'];
  public network = 1;
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
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    const dummyAsyncOptionsService = await moduleRef.resolve(
      DummyAsyncOptionsService,
    );
    const fallbackProvider = await moduleRef.resolve(
      SimpleFallbackJsonRpcBatchProvider,
    );

    expect(fallbackProvider).toBeInstanceOf(SimpleFallbackJsonRpcBatchProvider);
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

  const factory: Pick<ExecutionModuleAsyncOptions, 'useFactory' | 'inject'> = {
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
      ExecutionModule.forRootAsync(factory),
    ]);

    await testModules([
      ExecutionModule.forRootAsync({
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
      ExecutionModule.forFeatureAsync(factory),
    ]);

    await testModules([
      ExecutionModule.forFeatureAsync({
        imports: [
          TestAsyncModule.forRoot(),
          LoggerModule.forRoot({ transports: [nullTransport()] }),
        ],
        ...factory,
      }),
    ]);
  });
});
