import 'reflect-metadata';
import {
  DynamicModule,
  Injectable,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Registry } from 'prom-client';
import {
  BatchProviderModule,
  ExtendedJsonRpcBatchProvider,
  FallbackProviderModule,
} from '@lido-nestjs/execution';
import { LoggerModule, nullTransport } from '@lido-nestjs/logger';
import { RpcMetricsModule, RpcMetricsModuleAsyncOptions } from '../src';
import { fakeFetchFn } from '../../execution/test/fixtures/fake-json-rpc';

@Injectable()
class DummyAsyncOptionsService {
  public readonly registry = new Registry();
}

@Module({
  providers: [
    {
      provide: DummyAsyncOptionsService,
      useFactory: async () => {
        return new DummyAsyncOptionsService();
      },
    },
  ],
  exports: [DummyAsyncOptionsService],
})
class TestAsyncModule {
  public static forRoot(): DynamicModule {
    return {
      module: TestAsyncModule,
      global: true,
    };
  }
}

describe('RpcMetricsModule async initialization', () => {
  const factory: Pick<RpcMetricsModuleAsyncOptions, 'useFactory' | 'inject'> = {
    useFactory: async (service: DummyAsyncOptionsService) => {
      return {
        labels: {
          network: 'ethereum',
          layer: 'el',
          chainId: 1,
        },
        registry: service.registry,
      };
    },
    inject: [DummyAsyncOptionsService],
  };

  const expectMetricsRegistered = async (
    imports: ModuleMetadata['imports'],
  ): Promise<void> => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    await moduleRef.init();

    const service = await moduleRef.resolve(DummyAsyncOptionsService);
    expect(
      service.registry.getSingleMetric('http_rpc_requests_total'),
    ).toBeDefined();

    await moduleRef.close();
  };

  test('forRootAsync should use default fallback provider token', async () => {
    await expectMetricsRegistered([
      LoggerModule.forRoot({ transports: [nullTransport()] }),
      TestAsyncModule.forRoot(),
      FallbackProviderModule.forFeature({
        urls: ['http://localhost:8545'],
        network: 1,
        fetchFn: fakeFetchFn(),
      }),
      RpcMetricsModule.forRootAsync(factory),
    ]);
  });

  test('forFeatureAsync should support provider token override', async () => {
    await expectMetricsRegistered([
      TestAsyncModule.forRoot(),
      BatchProviderModule.forFeature({
        url: 'http://localhost:8545',
        network: 1,
        fetchFn: fakeFetchFn(),
      }),
      RpcMetricsModule.forFeatureAsync({
        providerToken: ExtendedJsonRpcBatchProvider,
        imports: [],
        ...factory,
      }),
    ]);
  });
});
