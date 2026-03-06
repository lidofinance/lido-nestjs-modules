import 'reflect-metadata';
import { Counter, Registry, register as defaultRegistry } from 'prom-client';
import { Test } from '@nestjs/testing';
import {
  BatchProviderModule,
  ExtendedJsonRpcBatchProvider,
  FallbackProviderEvents,
  FetchFn,
  FallbackProviderModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '@lido-nestjs/execution';
import { LoggerModule, nullTransport } from '@lido-nestjs/logger';
import { RpcMetricsModule } from '../src';
import {
  fakeFetchFn,
  fakeFetchFnWithMetrics,
  fixtures,
  makeFakeFetchFnThrowsError,
} from '../../execution/test/fixtures/fake-json-rpc';
import { RpcMetricsService } from '../src/rpc-metrics.service';

type MetricValue = {
  labels: Record<string, string>;
  metricName?: string;
  value: number;
};

const getMetricValue = async (
  registry: Registry,
  name: string,
  labels: Record<string, string>,
  suffix = '',
): Promise<number | undefined> => {
  const metrics = await registry.getMetricsAsJSON();
  const metric = metrics.find((value) => value.name === name);

  return metric?.values.find((entry) => {
    const current = entry as MetricValue;
    const metricName = current.metricName ?? name;

    return (
      metricName === `${name}${suffix}` &&
      Object.entries(labels).every(
        ([key, value]) => current.labels[key] === value,
      )
    );
  })?.value;
};

type TestListener = (event: FallbackProviderEvents) => void;

describe('RpcMetricsModule integration', () => {
  test('should record success metrics for extended provider', async () => {
    const registry = new Registry();
    const moduleRef = await Test.createTestingModule({
      imports: [
        BatchProviderModule.forFeature({
          url: 'https://eth-holesky.g.alchemy.com',
          network: 1,
          fetchFn: fakeFetchFnWithMetrics({
            durationMs: 150,
            payloadLengthBytes: 512,
            responseLengthBytes: 2048,
            statusCode: 200,
          }),
        }),
        RpcMetricsModule.forFeature({
          providerToken: ExtendedJsonRpcBatchProvider,
          labels: {
            network: 'Ethereum',
            layer: 'EL',
            chainId: 1,
          },
          registry,
        }),
      ],
    }).compile();

    await moduleRef.init();

    const provider = moduleRef.get(ExtendedJsonRpcBatchProvider);
    await provider.getBlock(42);

    const sharedLabels = {
      network: 'ethereum',
      layer: 'el',
      chain_id: '1',
      provider: 'alchemy.com',
    };

    expect(
      await getMetricValue(registry, 'http_rpc_requests_total', {
        ...sharedLabels,
        batched: 'false',
        response_code: '2xx',
        result: 'success',
      }),
    ).toBe(1);
    expect(
      await getMetricValue(
        registry,
        'http_rpc_batch_size',
        sharedLabels,
        '_count',
      ),
    ).toBe(1);
    expect(
      await getMetricValue(
        registry,
        'http_rpc_request_payload_bytes',
        sharedLabels,
        '_count',
      ),
    ).toBe(1);
    expect(
      await getMetricValue(
        registry,
        'http_rpc_response_seconds',
        sharedLabels,
        '_sum',
      ),
    ).toBeCloseTo(0.15);
    expect(
      await getMetricValue(
        registry,
        'http_rpc_response_payload_bytes',
        sharedLabels,
        '_sum',
      ),
    ).toBe(2048);
    expect(
      await getMetricValue(registry, 'rpc_request_total', {
        ...sharedLabels,
        method: 'eth_getBlockByNumber',
        result: 'success',
        rpc_error_code: '',
      }),
    ).toBe(1);

    await moduleRef.close();
  });

  test('should record mixed rpc results as failed http batch', async () => {
    const registry = new Registry();
    const mixedFetchFn: FetchFn = async ({ body }) => {
      const requests: Array<{ id: number; method: string }> = body
        ? JSON.parse(body)
        : [];

      return {
        data: requests.map((request) => {
          if (request.method === 'eth_getBlockByNumber') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: fixtures.eth_getBlockByNumber.default,
            };
          }

          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32603,
              message: 'internal error',
            },
          };
        }),
        metrics: {
          durationMs: 100,
          payloadLengthBytes: 256,
          responseLengthBytes: 1024,
          statusCode: 200,
        },
      };
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        BatchProviderModule.forFeature({
          url: 'https://lb.drpc.org',
          network: 1,
          requestPolicy: {
            jsonRpcMaxBatchSize: 10,
            maxConcurrentRequests: 5,
            batchAggregationWaitMs: 10,
          },
          fetchFn: mixedFetchFn,
        }),
        RpcMetricsModule.forFeature({
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

    const provider = moduleRef.get(ExtendedJsonRpcBatchProvider);
    await Promise.allSettled([
      provider.getBlock(42),
      provider.getBalance(fixtures.address),
    ]);

    const sharedLabels = {
      network: 'ethereum',
      layer: 'el',
      chain_id: '1',
      provider: 'drpc.org',
    };

    expect(
      await getMetricValue(registry, 'http_rpc_requests_total', {
        ...sharedLabels,
        batched: 'true',
        response_code: '2xx',
        result: 'fail',
      }),
    ).toBe(1);
    expect(
      await getMetricValue(registry, 'rpc_request_total', {
        ...sharedLabels,
        method: 'eth_getBlockByNumber',
        result: 'success',
        rpc_error_code: '',
      }),
    ).toBe(1);
    expect(
      await getMetricValue(registry, 'rpc_request_total', {
        ...sharedLabels,
        method: 'eth_getBalance',
        result: 'fail',
        rpc_error_code: '-32603',
      }),
    ).toBe(1);

    await moduleRef.close();
  });

  test('should record transport errors and keep request histograms', async () => {
    const registry = new Registry();
    const moduleRef = await Test.createTestingModule({
      imports: [
        BatchProviderModule.forFeature({
          url: 'https://lb.drpc.org',
          network: 1,
          fetchFn: makeFakeFetchFnThrowsError(new Error('Fetch failed')),
        }),
        RpcMetricsModule.forFeature({
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

    const provider = moduleRef.get(ExtendedJsonRpcBatchProvider);
    await expect(provider.getBlock(42)).rejects.toThrow('Fetch failed');

    const sharedLabels = {
      network: 'ethereum',
      layer: 'el',
      chain_id: '1',
      provider: 'drpc.org',
    };

    expect(
      await getMetricValue(
        registry,
        'http_rpc_batch_size',
        sharedLabels,
        '_count',
      ),
    ).toBe(1);
    expect(
      await getMetricValue(
        registry,
        'http_rpc_request_payload_bytes',
        sharedLabels,
        '_count',
      ),
    ).toBe(1);
    expect(
      await getMetricValue(registry, 'http_rpc_requests_total', {
        ...sharedLabels,
        batched: 'false',
        response_code: '',
        result: 'fail',
      }),
    ).toBe(1);
    expect(
      await getMetricValue(registry, 'rpc_request_total', {
        ...sharedLabels,
        method: 'eth_getBlockByNumber',
        result: 'fail',
        rpc_error_code: '',
      }),
    ).toBe(1);
    expect(
      await getMetricValue(
        registry,
        'http_rpc_response_seconds',
        sharedLabels,
        '_count',
      ),
    ).toBeUndefined();

    await moduleRef.close();
  });

  test('should record batched transport errors', async () => {
    const registry = new Registry();
    const moduleRef = await Test.createTestingModule({
      imports: [
        BatchProviderModule.forFeature({
          url: 'https://lb.drpc.org',
          network: 1,
          requestPolicy: {
            jsonRpcMaxBatchSize: 10,
            maxConcurrentRequests: 5,
            batchAggregationWaitMs: 10,
          },
          fetchFn: makeFakeFetchFnThrowsError(new Error('Fetch failed')),
        }),
        RpcMetricsModule.forFeature({
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

    const provider = moduleRef.get(ExtendedJsonRpcBatchProvider);
    await Promise.allSettled([
      provider.getBlock(42),
      provider.getBalance(fixtures.address),
    ]);

    expect(
      await getMetricValue(registry, 'http_rpc_requests_total', {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'drpc.org',
        batched: 'true',
        response_code: '',
        result: 'fail',
      }),
    ).toBe(1);

    await moduleRef.close();
  });

  test('should record response without http metrics using empty response_code', async () => {
    const registry = new Registry();
    const moduleRef = await Test.createTestingModule({
      imports: [
        BatchProviderModule.forFeature({
          url: 'https://lb.drpc.org',
          network: 1,
          fetchFn: fakeFetchFn(),
        }),
        RpcMetricsModule.forFeature({
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

    const provider = moduleRef.get(ExtendedJsonRpcBatchProvider);
    await provider.getBlock(42);

    const sharedLabels = {
      network: 'ethereum',
      layer: 'el',
      chain_id: '1',
      provider: 'drpc.org',
    };

    expect(
      await getMetricValue(registry, 'http_rpc_requests_total', {
        ...sharedLabels,
        batched: 'false',
        response_code: '',
        result: 'success',
      }),
    ).toBe(1);
    expect(
      await getMetricValue(
        registry,
        'http_rpc_response_seconds',
        sharedLabels,
        '_count',
      ),
    ).toBeUndefined();
    expect(
      await getMetricValue(
        registry,
        'http_rpc_response_payload_bytes',
        sharedLabels,
        '_count',
      ),
    ).toBeUndefined();

    await moduleRef.close();
  });

  test('should mark missing response ids as failed rpc requests without rpc_error_code', async () => {
    const registry = new Registry();
    const partialFetchFn: FetchFn = async ({ body }) => {
      const requests: Array<{ id: number }> = body ? JSON.parse(body) : [];

      return {
        data: requests.map((request) => ({
          jsonrpc: '2.0',
          id: request.id + 1000,
          result: {},
        })),
        metrics: {
          durationMs: 20,
          payloadLengthBytes: 128,
          responseLengthBytes: 256,
          statusCode: 204,
        },
      };
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        BatchProviderModule.forFeature({
          url: 'https://lb.drpc.org',
          network: 1,
          fetchFn: partialFetchFn,
        }),
        RpcMetricsModule.forFeature({
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

    const provider = moduleRef.get(ExtendedJsonRpcBatchProvider);
    await expect(provider.getBlock(42)).rejects.toThrow();

    const sharedLabels = {
      network: 'ethereum',
      layer: 'el',
      chain_id: '1',
      provider: 'drpc.org',
    };

    expect(
      await getMetricValue(registry, 'http_rpc_requests_total', {
        ...sharedLabels,
        batched: 'false',
        response_code: '2xx',
        result: 'fail',
      }),
    ).toBe(1);
    expect(
      await getMetricValue(registry, 'rpc_request_total', {
        ...sharedLabels,
        method: 'eth_getBlockByNumber',
        result: 'fail',
        rpc_error_code: '',
      }),
    ).toBe(1);

    await moduleRef.close();
  });

  test('should use fallback provider by default and preserve IP:port labels', async () => {
    const registry = new Registry();
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({ transports: [nullTransport()] }),
        FallbackProviderModule.forFeature({
          urls: ['http://192.168.0.1:8545'],
          network: 1,
          fetchFn: fakeFetchFnWithMetrics({
            durationMs: 50,
            payloadLengthBytes: 256,
            responseLengthBytes: 512,
            statusCode: 200,
          }),
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

    const provider = moduleRef.get(SimpleFallbackJsonRpcBatchProvider);
    await provider.getBlock(42);

    expect(
      await getMetricValue(registry, 'rpc_request_total', {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: '192.168.0.1:8545',
        method: 'eth_getBlockByNumber',
        result: 'success',
        rpc_error_code: '',
      }),
    ).toBe(1);

    clearTimeout(
      (
        provider as SimpleFallbackJsonRpcBatchProvider & {
          resetTimer?: ReturnType<typeof setTimeout>;
        }
      ).resetTimer,
    );
    await moduleRef.close();
  });

  test('should fail on registry metric name conflict', async () => {
    const registry = new Registry();
    new Counter({
      name: 'http_rpc_requests_total',
      help: 'conflict',
      registers: [registry],
    });

    await expect(
      Test.createTestingModule({
        imports: [
          BatchProviderModule.forFeature({
            url: 'http://localhost:8545',
            network: 1,
            fetchFn: fakeFetchFnWithMetrics({
              durationMs: 10,
              payloadLengthBytes: 32,
              responseLengthBytes: 64,
              statusCode: 200,
            }),
          }),
          RpcMetricsModule.forFeature({
            providerToken: ExtendedJsonRpcBatchProvider,
            labels: {
              network: 'ethereum',
              layer: 'el',
              chainId: 1,
            },
            registry,
          }),
        ],
      }).compile(),
    ).rejects.toThrow(
      'Prometheus registry already contains policy metric(s): http_rpc_requests_total',
    );
  });

  test('should allow destroy before init', () => {
    const service = new RpcMetricsService(
      {
        get: () => {
          throw new Error('should not be called');
        },
      } as never,
      {
        labels: {
          network: 'ethereum',
          layer: 'el',
          chainId: 1,
        },
        providerToken: SimpleFallbackJsonRpcBatchProvider,
        registry: new Registry(),
      },
    );

    expect(() => service.onModuleDestroy()).not.toThrow();
  });

  test('should use default registry and fallback domain when provider url is missing', async () => {
    defaultRegistry.clear();

    const listeners: TestListener[] = [];
    const provider = {
      eventEmitter: {
        on: (_eventName: 'rpc', listener: TestListener) => {
          listeners.push(listener);
        },
        removeListener: (_eventName: 'rpc', listener: TestListener) => {
          const index = listeners.indexOf(listener);
          if (index >= 0) listeners.splice(index, 1);
        },
      },
    };

    const service = new RpcMetricsService(
      {
        get: () => provider,
      } as never,
      {
        labels: {
          network: 'Ethereum',
          layer: 'EL',
          chainId: 1,
        },
        providerToken: SimpleFallbackJsonRpcBatchProvider,
      },
    );

    service.onModuleInit();

    listeners[0]({
      action: 'provider:response-batched',
      request: [
        {
          method: 'eth_getBlockByNumber',
          params: ['0x2a', false],
          id: 1,
          jsonrpc: '2.0',
        },
      ],
      provider: {} as ExtendedJsonRpcBatchProvider,
      domain: 'subdomain.example.com',
      results: [{ id: 1, result: 'success' }],
    });

    const value = await getMetricValue(defaultRegistry, 'rpc_request_total', {
      network: 'ethereum',
      layer: 'el',
      chain_id: '1',
      provider: 'example.com',
      method: 'eth_getBlockByNumber',
      result: 'success',
      rpc_error_code: '',
    });

    expect(value).toBe(1);

    service.onModuleDestroy();
    defaultRegistry.clear();
  });

  test('should fallback to fail and empty rpc_error_code when response result is missing', async () => {
    const registry = new Registry();
    const listeners: TestListener[] = [];
    const provider = {
      eventEmitter: {
        on: (_eventName: 'rpc', listener: TestListener) => {
          listeners.push(listener);
        },
        removeListener: (_eventName: 'rpc', listener: TestListener) => {
          const index = listeners.indexOf(listener);
          if (index >= 0) listeners.splice(index, 1);
        },
      },
    };

    const service = new RpcMetricsService(
      {
        get: () => provider,
      } as never,
      {
        labels: {
          network: 'ethereum',
          layer: 'el',
          chainId: 1,
        },
        providerToken: SimpleFallbackJsonRpcBatchProvider,
        registry,
      },
    );

    service.onModuleInit();

    listeners[0]({
      action: 'provider:response-batched',
      request: [
        {
          method: 'eth_call',
          params: [],
          id: 1,
          jsonrpc: '2.0',
        },
      ],
      provider: {
        connection: {
          url: 'https://lb.drpc.org',
        },
      } as ExtendedJsonRpcBatchProvider,
      domain: 'lb.drpc.org',
      results: [],
      httpInfo: {
        durationMs: 1,
        payloadLengthBytes: 32,
        responseLengthBytes: 64,
        statusCode: 200,
      },
    });

    expect(
      await getMetricValue(registry, 'rpc_request_total', {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'drpc.org',
        method: 'eth_call',
        result: 'fail',
        rpc_error_code: '',
      }),
    ).toBe(1);

    service.onModuleDestroy();
  });

  test('should unregister collectors on destroy so the same registry can be reused', async () => {
    defaultRegistry.clear();

    const compileModule = async () =>
      Test.createTestingModule({
        imports: [
          BatchProviderModule.forFeature({
            url: 'https://lb.drpc.org',
            network: 1,
            fetchFn: fakeFetchFnWithMetrics({
              durationMs: 10,
              payloadLengthBytes: 32,
              responseLengthBytes: 64,
              statusCode: 200,
            }),
          }),
          RpcMetricsModule.forFeature({
            providerToken: ExtendedJsonRpcBatchProvider,
            labels: {
              network: 'ethereum',
              layer: 'el',
              chainId: 1,
            },
          }),
        ],
      }).compile();

    const firstModuleRef = await compileModule();
    await firstModuleRef.init();
    await firstModuleRef.close();

    expect(defaultRegistry.getSingleMetric('http_rpc_requests_total')).toBe(
      undefined,
    );

    const secondModuleRef = await compileModule();
    await secondModuleRef.init();
    await secondModuleRef.close();

    defaultRegistry.clear();
  });
});
