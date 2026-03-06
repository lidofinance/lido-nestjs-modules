import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { Registry } from 'prom-client';
import {
  BatchProviderModule,
  ExtendedJsonRpcBatchProvider,
  FallbackProviderModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '@lido-nestjs/execution';
import { LoggerModule, nullTransport } from '@lido-nestjs/logger';
import { RpcMetricsModule } from '../src';
import { fakeFetchFn } from '../../execution/test/fixtures/fake-json-rpc';

describe('RpcMetricsModule sync initialization', () => {
  test('forRoot should register policy metrics with explicit provider token', async () => {
    const registry = new Registry();
    const moduleRef = await Test.createTestingModule({
      imports: [
        BatchProviderModule.forFeature({
          url: 'http://localhost:8545',
          network: 1,
          fetchFn: fakeFetchFn(),
        }),
        RpcMetricsModule.forRoot({
          providerToken: ExtendedJsonRpcBatchProvider,
          labels: {
            network: 'ethereum',
            layer: 'el',
            chainId: 1,
          },
          registry,
        }),
      ],
    }).compile();

    await moduleRef.init();

    expect(registry.getSingleMetric('http_rpc_requests_total')).toBeDefined();
    expect(registry.getSingleMetric('rpc_request_total')).toBeDefined();

    await moduleRef.close();
  });

  test('forFeature should default to SimpleFallbackJsonRpcBatchProvider', async () => {
    const registry = new Registry();
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({ transports: [nullTransport()] }),
        FallbackProviderModule.forFeature({
          urls: ['http://localhost:8545'],
          network: 1,
          fetchFn: fakeFetchFn(),
        }),
        RpcMetricsModule.forFeature({
          labels: {
            network: 'ethereum',
            layer: 'el',
            chainId: 1,
          },
          registry,
        }),
      ],
    }).compile();

    await moduleRef.init();

    expect(moduleRef.get(SimpleFallbackJsonRpcBatchProvider)).toBeInstanceOf(
      SimpleFallbackJsonRpcBatchProvider,
    );
    expect(registry.getSingleMetric('http_rpc_batch_size')).toBeDefined();

    await moduleRef.close();
  });
});
