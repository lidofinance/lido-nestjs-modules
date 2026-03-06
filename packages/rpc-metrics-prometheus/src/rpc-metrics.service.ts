import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  ExtendedJsonRpcBatchProvider,
  FallbackProviderEvents,
  ProviderEvents,
  ProviderResponseBatchedEvent,
  ProviderResponseBatchedErrorEvent,
} from '@lido-nestjs/execution';
import {
  Counter,
  Histogram,
  Registry,
  register as defaultRegistry,
} from 'prom-client';
import {
  HTTP_RPC_BATCH_SIZE_METRIC,
  HTTP_RPC_REQUEST_PAYLOAD_BYTES_METRIC,
  HTTP_RPC_REQUESTS_TOTAL_METRIC,
  HTTP_RPC_RESPONSE_PAYLOAD_BYTES_METRIC,
  HTTP_RPC_RESPONSE_SECONDS_METRIC,
  POLICY_METRIC_NAMES,
  RPC_METRICS_MODULE_OPTIONS,
  RPC_REQUEST_TOTAL_METRIC,
} from './rpc-metrics.constants';
import {
  RpcMetricsLabels,
  RpcMetricsModuleResolvedOptions,
  RpcMetricsProviderToken,
} from './interfaces/module.options';
import { normalizeProviderLabel } from './utils/provider-label';

type RpcEventEmitter = {
  on(eventName: 'rpc', listener: (event: FallbackProviderEvents) => void): void;
  removeListener(
    eventName: 'rpc',
    listener: (event: FallbackProviderEvents) => void,
  ): void;
};

type RpcProviderWithEvents = {
  eventEmitter: RpcEventEmitter;
};

type SharedLabels = {
  network: string;
  layer: string;
  chain_id: string;
  provider: string;
};

const getRequestPayloadLength = (
  request: ProviderEvents['request'],
): number => {
  // ExtendedJsonRpcBatchProvider serializes the batch via JSON.stringify.
  return JSON.stringify(request).length;
};

const aggregateResponseCode = (statusCode?: number): string => {
  if (!statusCode || statusCode < 100 || statusCode > 599) {
    return '';
  }

  return `${Math.floor(statusCode / 100)}xx`;
};

@Injectable()
export class RpcMetricsService implements OnModuleInit, OnModuleDestroy {
  protected readonly registry: Registry;
  protected readonly labels: RpcMetricsLabels;
  protected readonly providerToken: RpcMetricsProviderToken;
  protected readonly httpRpcRequestsTotal: Counter<string>;
  protected readonly httpRpcBatchSize: Histogram<string>;
  protected readonly httpRpcResponseSeconds: Histogram<string>;
  protected readonly httpRpcRequestPayloadBytes: Histogram<string>;
  protected readonly httpRpcResponsePayloadBytes: Histogram<string>;
  protected readonly rpcRequestTotal: Counter<string>;
  protected provider: RpcProviderWithEvents | null = null;
  protected readonly listener = (event: FallbackProviderEvents): void => {
    this.handleEvent(event);
  };

  public constructor(
    protected readonly moduleRef: ModuleRef,
    @Inject(RPC_METRICS_MODULE_OPTIONS)
    options: RpcMetricsModuleResolvedOptions,
  ) {
    this.registry = options.registry ?? defaultRegistry;
    this.providerToken = options.providerToken;
    this.labels = {
      network: options.labels.network.toLowerCase(),
      layer: options.labels.layer.toLowerCase(),
      chainId: String(options.labels.chainId),
    };

    this.assertMetricNamesAvailable();

    this.httpRpcRequestsTotal = new Counter({
      ...HTTP_RPC_REQUESTS_TOTAL_METRIC,
      registers: [this.registry],
    });
    this.httpRpcBatchSize = new Histogram({
      ...HTTP_RPC_BATCH_SIZE_METRIC,
      registers: [this.registry],
    });
    this.httpRpcResponseSeconds = new Histogram({
      ...HTTP_RPC_RESPONSE_SECONDS_METRIC,
      registers: [this.registry],
    });
    this.httpRpcRequestPayloadBytes = new Histogram({
      ...HTTP_RPC_REQUEST_PAYLOAD_BYTES_METRIC,
      registers: [this.registry],
    });
    this.httpRpcResponsePayloadBytes = new Histogram({
      ...HTTP_RPC_RESPONSE_PAYLOAD_BYTES_METRIC,
      registers: [this.registry],
    });
    this.rpcRequestTotal = new Counter({
      ...RPC_REQUEST_TOTAL_METRIC,
      registers: [this.registry],
    });
  }

  public onModuleInit(): void {
    this.provider = this.moduleRef.get<RpcProviderWithEvents>(
      this.providerToken,
      {
        strict: false,
      },
    );
    this.provider.eventEmitter.on('rpc', this.listener);
  }

  public onModuleDestroy(): void {
    this.provider?.eventEmitter.removeListener('rpc', this.listener);
    POLICY_METRIC_NAMES.forEach((name) => {
      this.registry.removeSingleMetric(name);
    });
  }

  protected assertMetricNamesAvailable(): void {
    const conflicts = POLICY_METRIC_NAMES.filter((name) =>
      this.registry.getSingleMetric(name),
    );

    if (conflicts.length > 0) {
      throw new Error(
        `Prometheus registry already contains policy metric(s): ${conflicts.join(
          ', ',
        )}`,
      );
    }
  }

  protected handleEvent(event: FallbackProviderEvents): void {
    switch (event.action) {
      case 'provider:request-batched':
        this.observeRequestMetrics(event);
        return;
      case 'provider:response-batched':
        this.observeResponseMetrics(event);
        return;
      case 'provider:response-batched:error':
        this.observeErrorMetrics(event);
        return;
      default:
        return;
    }
  }

  protected observeRequestMetrics(
    event: Extract<ProviderEvents, { action: 'provider:request-batched' }>,
  ): void {
    const labels = this.getSharedLabels(event.provider, event.domain);

    this.httpRpcBatchSize.observe(labels, event.request.length);
    this.httpRpcRequestPayloadBytes.observe(
      labels,
      getRequestPayloadLength(event.request),
    );
  }

  protected observeResponseMetrics(event: ProviderResponseBatchedEvent): void {
    const labels = this.getSharedLabels(event.provider, event.domain);
    const result: 'success' | 'fail' = event.results.every(
      (value) => value.result === 'success',
    )
      ? 'success'
      : 'fail';

    this.httpRpcRequestsTotal.inc({
      ...labels,
      batched: event.request.length > 1 ? 'true' : 'false',
      response_code: aggregateResponseCode(event.httpInfo?.statusCode),
      result,
    });

    if (typeof event.httpInfo?.durationMs === 'number') {
      this.httpRpcResponseSeconds.observe(
        labels,
        event.httpInfo.durationMs / 1000,
      );
    }

    if (typeof event.httpInfo?.responseLengthBytes === 'number') {
      this.httpRpcResponsePayloadBytes.observe(
        labels,
        event.httpInfo.responseLengthBytes,
      );
    }

    const resultsById = new Map(
      event.results.map((value) => [value.id, value]),
    );

    event.request.forEach((request) => {
      const requestResult = resultsById.get(request.id);
      this.rpcRequestTotal.inc({
        ...labels,
        method: request.method,
        result: requestResult?.result ?? 'fail',
        rpc_error_code: requestResult?.rpcErrorCode ?? '',
      });
    });
  }

  protected observeErrorMetrics(
    event: ProviderResponseBatchedErrorEvent,
  ): void {
    const labels = this.getSharedLabels(event.provider, event.domain);

    this.httpRpcRequestsTotal.inc({
      ...labels,
      batched: event.request.length > 1 ? 'true' : 'false',
      response_code: '',
      result: 'fail',
    });

    event.request.forEach((request) => {
      this.rpcRequestTotal.inc({
        ...labels,
        method: request.method,
        result: 'fail',
        rpc_error_code: '',
      });
    });
  }

  protected getSharedLabels(
    provider: ExtendedJsonRpcBatchProvider,
    domain: string,
  ): SharedLabels {
    const url = provider.connection?.url;

    return {
      network: this.labels.network,
      layer: this.labels.layer,
      chain_id: String(this.labels.chainId),
      provider: normalizeProviderLabel(url, domain),
    };
  }
}
