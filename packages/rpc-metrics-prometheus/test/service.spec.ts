import { EventEmitter } from 'events';
import { JsonRpcRequest } from '@lido-nestjs/execution';
import { Histogram, Registry, register } from 'prom-client';
import { RPC_METRIC_NAMES } from '../src/rpc-metrics-prometheus.constants';
import { RpcMetricsPrometheusService } from '../src/rpc-metrics-prometheus.service';
import { RpcProviderWithEventEmitter } from '../src/rpc-metrics-prometheus.types';

class FakeProvider implements RpcProviderWithEventEmitter {
  public readonly eventEmitter =
    new EventEmitter() as RpcProviderWithEventEmitter['eventEmitter'];
}

type LabelMap = Record<string, string>;
type MetricEntry = {
  metricName?: string;
  labels: Partial<Record<string, string | number>>;
  value: number | string;
};

describe('RpcMetricsPrometheusService', () => {
  const defaultOptions = {
    network: 'ethereum',
    layer: 'el',
    chainId: 1,
  };

  afterEach(() => {
    register.clear();
    jest.restoreAllMocks();
  });

  const buildService = (registry = new Registry()) => {
    const provider = new FakeProvider();
    const service = new RpcMetricsPrometheusService(
      { ...defaultOptions, registry },
      provider,
    );

    return { provider, service, registry };
  };

  test('should warn when provider has no event emitter', () => {
    const service = new RpcMetricsPrometheusService(
      defaultOptions,
      {} as never,
    );
    const logger = (
      service as never as {
        logger: { warn: (message: string) => void };
      }
    ).logger;
    const warnSpy = jest
      .spyOn(logger, 'warn')
      .mockImplementation(() => undefined);

    service.onModuleInit();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
  });

  test('should initialize ws metrics with zero values', async () => {
    const { service, registry } = buildService();

    service.onModuleInit();

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.WS_RPC_CONNECTIONS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'unknown',
        },
      ),
    ).toBe(0);

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.WS_RPC_REQUESTS_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'unknown',
        result: 'success',
      }),
    ).toBe(0);

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.WS_RPC_REQUESTS_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'unknown',
        result: 'fail',
      }),
    ).toBe(0);
  });

  test('should track successful batched responses with response payload', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [],
      },
      {
        id: 2,
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'https://lb.drpc.org',
    });

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched',
      request,
      domain: 'https://lb.drpc.org',
      response: [
        {
          id: 2,
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal JSON-RPC error',
          },
        },
        {
          id: 1,
          jsonrpc: '2.0',
          result: '0x1',
        },
      ],
    });

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'drpc.org',
          batched: 'true',
          response_code: '2xx',
          result: 'success',
        },
      ),
    ).toBe(1);

    expect(
      await getHistogramCount(registry, RPC_METRIC_NAMES.HTTP_RPC_BATCH_SIZE, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'drpc.org',
      }),
    ).toBe(1);

    expect(
      await getHistogramCount(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUEST_PAYLOAD_BYTES,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'drpc.org',
        },
      ),
    ).toBe(1);

    expect(
      await getHistogramCount(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_RESPONSE_PAYLOAD_BYTES,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'drpc.org',
        },
      ),
    ).toBe(1);

    expect(
      await getHistogramCount(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_RESPONSE_SECONDS,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'drpc.org',
        },
      ),
    ).toBe(1);

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.RPC_REQUEST_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'drpc.org',
        method: 'eth_call',
        result: 'success',
        rpc_error_code: '',
      }),
    ).toBe(1);

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.RPC_REQUEST_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'drpc.org',
        method: 'eth_getBlockByNumber',
        result: 'fail',
        rpc_error_code: '-32603',
      }),
    ).toBe(1);
  });

  test('should track responses without payload in best-effort mode', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 3,
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'eth-holesky.g.alchemy.com',
    });

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched',
      request,
      domain: 'eth-holesky.g.alchemy.com',
    });

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.RPC_REQUEST_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'alchemy.com',
        method: 'eth_call',
        result: 'success',
        rpc_error_code: '',
      }),
    ).toBe(1);

    expect(
      await getHistogramCount(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_RESPONSE_PAYLOAD_BYTES,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'alchemy.com',
        },
      ),
    ).toBe(0);
  });

  test('should track transport errors and response status classes', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 4,
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'http://192.168.0.1:8545',
    });

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched:error',
      request,
      domain: 'http://192.168.0.1:8545',
      error: {
        status: 429,
        code: -32000,
      },
    });

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: '192.168.0.1:8545',
          batched: 'false',
          response_code: '4xx',
          result: 'fail',
        },
      ),
    ).toBe(1);

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.RPC_REQUEST_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: '192.168.0.1:8545',
        method: 'eth_getBalance',
        result: 'fail',
        rpc_error_code: '-32000',
      }),
    ).toBe(1);
  });

  test('should mark batched transport errors for multi-call batches', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 41,
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [],
      },
      {
        id: 42,
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'https://lb.drpc.org',
    });

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched:error',
      request,
      domain: 'https://lb.drpc.org',
      error: { status: 500 },
    });

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'drpc.org',
          batched: 'true',
          response_code: '5xx',
          result: 'fail',
        },
      ),
    ).toBe(1);
  });

  test('should handle string status in error response', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 51,
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'https://rpc.example.org',
    });

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched:error',
      request,
      domain: 'https://rpc.example.org',
      error: { status: '502' },
    });

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'example.org',
          batched: 'false',
          response_code: '5xx',
          result: 'fail',
        },
      ),
    ).toBe(1);
  });

  test('should emit empty response_code when status is unavailable', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 5,
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'https://rpc.example.org',
    });

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched:error',
      request,
      domain: 'https://rpc.example.org',
      error: {
        message: 'dns resolution failed',
      },
    });

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'example.org',
          batched: 'false',
          response_code: '',
          result: 'fail',
        },
      ),
    ).toBe(1);
  });

  test('should ignore unknown rpc events', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    provider.eventEmitter.emit('rpc', {
      action: 'fallback-provider:request',
      domain: 'https://rpc.example.org',
    });

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'example.org',
          batched: 'false',
          response_code: '2xx',
          result: 'success',
        },
      ),
    ).toBe(0);
  });

  test('should not observe response duration without request start', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 6,
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched',
      request,
      domain: 'https://rpc.example.org',
      response: {
        id: 6,
        jsonrpc: '2.0',
        result: '0x1',
      },
    });

    expect(
      await getHistogramCount(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_RESPONSE_SECONDS,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'example.org',
        },
      ),
    ).toBe(0);
  });

  test('should handle partial response maps by method with mixed outcomes', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 61,
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [],
      },
      {
        id: 62,
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'https://rpc.example.org',
    });

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched',
      request,
      domain: 'https://rpc.example.org',
      response: [
        {
          id: 61,
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Execution reverted',
          },
        },
      ],
    });

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.RPC_REQUEST_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'example.org',
        method: 'eth_call',
        result: 'fail',
        rpc_error_code: '-32001',
      }),
    ).toBe(1);

    expect(
      await getCounterValue(registry, RPC_METRIC_NAMES.RPC_REQUEST_TOTAL, {
        network: 'ethereum',
        layer: 'el',
        chain_id: '1',
        provider: 'example.org',
        method: 'eth_chainId',
        result: 'success',
        rpc_error_code: '',
      }),
    ).toBe(1);
  });

  test('should cleanup stale pending requests when map grows too large', () => {
    const { service, provider } = buildService();

    service.onModuleInit();

    const pendingRequests = (
      service as unknown as {
        pendingRequests: Map<string, number>;
      }
    ).pendingRequests;

    const now = Date.now();

    for (let i = 0; i < 1001; i++) {
      pendingRequests.set(`old-${i}`, now - 10 * 60 * 1000);
    }

    const request: JsonRpcRequest[] = [
      {
        id: 7,
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [],
      },
    ];

    pendingRequests.set('7', now - 10);

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched',
      request,
      domain: 'https://rpc.example.org',
      response: {
        id: 7,
        jsonrpc: '2.0',
        result: '0x1',
      },
    });

    expect(pendingRequests.size).toBe(0);
  });

  test('should remove listener and clear pending requests on destroy', async () => {
    const { service, provider, registry } = buildService();

    service.onModuleInit();

    const request: JsonRpcRequest[] = [
      {
        id: 8,
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [],
      },
    ];

    provider.eventEmitter.emit('rpc', {
      action: 'provider:request-batched',
      request,
      domain: 'https://rpc.example.org',
    });

    service.onModuleDestroy();

    provider.eventEmitter.emit('rpc', {
      action: 'provider:response-batched',
      request,
      domain: 'https://rpc.example.org',
      response: {
        id: 8,
        jsonrpc: '2.0',
        result: '0x1',
      },
    });

    expect(
      await getCounterValue(
        registry,
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        {
          network: 'ethereum',
          layer: 'el',
          chain_id: '1',
          provider: 'example.org',
          batched: 'false',
          response_code: '2xx',
          result: 'success',
        },
      ),
    ).toBe(0);
  });

  test('should throw when counter metric with same name already exists', () => {
    const sharedRegistry = new Registry();
    sharedRegistry.registerMetric(
      new Histogram({
        name: RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        help: 'conflicting metric',
        labelNames: ['network'],
        registers: [sharedRegistry],
      }),
    );

    expect(() => buildService(sharedRegistry)).toThrow(
      'Metric already exists: http_rpc_requests_total',
    );
  });

  test('should throw when histogram metric with same name already exists', () => {
    const sharedRegistry = new Registry();
    sharedRegistry.registerMetric(
      new Histogram({
        name: RPC_METRIC_NAMES.HTTP_RPC_BATCH_SIZE,
        help: 'conflicting metric',
        labelNames: ['network'],
        registers: [sharedRegistry],
      }),
    );

    expect(() => buildService(sharedRegistry)).toThrow(
      'Metric already exists: http_rpc_batch_size',
    );
  });
});

const getCounterValue = async (
  registry: Registry,
  name: string,
  labels: LabelMap,
): Promise<number> => {
  const metric = registry.getSingleMetric(name);
  if (!metric) {
    return 0;
  }

  const metricValue = await metric.get();
  const entries = metricValue.values as MetricEntry[];
  const value = entries.find((entry) => labelsMatch(entry.labels, labels));

  return value ? Number(value.value) : 0;
};

const getHistogramCount = async (
  registry: Registry,
  name: string,
  labels: LabelMap,
): Promise<number> => {
  const metric = registry.getSingleMetric(name);
  if (!metric) {
    return 0;
  }

  const metricValue = await metric.get();
  const entries = metricValue.values as MetricEntry[];
  const value = entries.find(
    (entry) =>
      entry.metricName === `${name}_count` && labelsMatch(entry.labels, labels),
  );

  return value ? Number(value.value) : 0;
};

const labelsMatch = (
  actualLabels: Partial<Record<string, string | number>>,
  expectedLabels: LabelMap,
): boolean => {
  return Object.entries(expectedLabels).every(([key, value]) => {
    return `${actualLabels[key] ?? ''}` === value;
  });
};
