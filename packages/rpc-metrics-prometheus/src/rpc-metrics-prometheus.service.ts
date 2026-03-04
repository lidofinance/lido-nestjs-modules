import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Counter, Histogram, Registry, register } from 'prom-client';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  ProviderEvents,
  ProviderRequestBatchedEvent,
  ProviderResponseBatchedEvent,
  ProviderResponseBatchedErrorEvent,
} from '@lido-nestjs/execution';
import {
  RPC_METRIC_BUCKETS,
  RPC_METRIC_NAMES,
  RPC_METRIC_VALUES,
  RPC_METRICS_OPTIONS,
  RPC_METRICS_PROVIDER_TOKEN,
} from './rpc-metrics-prometheus.constants';
import { RpcMetricsPrometheusBaseOptions } from './rpc-metrics-prometheus.interfaces';
import {
  BaseMetricLabels,
  MetricResult,
  RpcProviderWithEventEmitter,
} from './rpc-metrics-prometheus.types';
import {
  calculatePayloadSize,
  extractHttpErrorCode,
  extractRpcErrorCode,
  getRequestKey,
  isRpcProviderWithEventEmitter,
  normalizeMethod,
  normalizeProvider,
} from './rpc-metrics-prometheus.utils';

type BaseLabel = 'network' | 'layer' | 'chain_id' | 'provider';
type HttpRequestLabel = BaseLabel | 'batched' | 'response_code' | 'result';
type RpcRequestLabel = BaseLabel | 'method' | 'result' | 'rpc_error_code';
type WsRequestLabel = BaseLabel | 'result';

type HttpRequestLabels = BaseMetricLabels & {
  batched: string;
  response_code: string;
  result: MetricResult;
};

interface RpcPrometheusMetrics {
  httpRpcRequestsTotal: Counter<HttpRequestLabel>;
  httpRpcBatchSize: Histogram<BaseLabel>;
  httpRpcResponseSeconds: Histogram<BaseLabel>;
  httpRpcRequestPayloadBytes: Histogram<BaseLabel>;
  httpRpcResponsePayloadBytes: Histogram<BaseLabel>;
  wsRpcConnectionsTotal: Counter<BaseLabel>;
  wsRpcRequestsTotal: Counter<WsRequestLabel>;
  rpcRequestTotal: Counter<RpcRequestLabel>;
}

// for execution <= 1.19
type ProviderResponseBatchedEventCompat = ProviderResponseBatchedEvent & {
  response?: JsonRpcResponse[] | JsonRpcResponse;
};
type ProviderResponseBatchedErrorEventCompat =
  ProviderResponseBatchedErrorEvent & {
    response?: JsonRpcResponse[] | JsonRpcResponse;
  };

@Injectable()
export class RpcMetricsPrometheusService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RpcMetricsPrometheusService.name);
  private readonly registry: Registry;
  private readonly chainId: string;
  private readonly pendingRequests = new Map<string, number>();
  private readonly metrics: RpcPrometheusMetrics;

  private readonly rpcEventHandler = (event: ProviderEvents): void => {
    this.handleRpcEvent(event);
  };

  public constructor(
    @Inject(RPC_METRICS_OPTIONS)
    private readonly options: RpcMetricsPrometheusBaseOptions,
    @Inject(RPC_METRICS_PROVIDER_TOKEN)
    private readonly provider: RpcProviderWithEventEmitter,
  ) {
    this.registry = options.registry ?? register;
    this.chainId = String(options.chainId);
    this.metrics = this.createMetrics();
  }

  public onModuleInit(): void {
    if (!isRpcProviderWithEventEmitter(this.provider)) {
      this.logger.warn(
        'Provider eventEmitter not available, RPC metrics will not be tracked',
      );
      return;
    }

    this.provider.eventEmitter.on('rpc', this.rpcEventHandler);

    const zeroLabels = this.getBaseLabels(RPC_METRIC_VALUES.UNKNOWN_PROVIDER);
    this.metrics.wsRpcConnectionsTotal.inc(zeroLabels, 0);
    this.metrics.wsRpcRequestsTotal.inc(
      {
        ...zeroLabels,
        result: RPC_METRIC_VALUES.RESULT_SUCCESS,
      },
      0,
    );
    this.metrics.wsRpcRequestsTotal.inc(
      {
        ...zeroLabels,
        result: RPC_METRIC_VALUES.RESULT_FAIL,
      },
      0,
    );
  }

  public onModuleDestroy(): void {
    if (isRpcProviderWithEventEmitter(this.provider)) {
      this.provider.eventEmitter.off('rpc', this.rpcEventHandler);
    }

    this.pendingRequests.clear();
  }

  private handleRpcEvent(event: ProviderEvents): void {
    switch (event.action) {
      case 'provider:request-batched':
        this.trackRequestStart(event);
        return;
      case 'provider:response-batched':
        this.trackBatchedResponse(event);
        return;
      case 'provider:response-batched:error':
        this.trackBatchedErrorResponse(event);
        return;
      default:
        return;
    }
  }

  private trackRequestStart(event: ProviderRequestBatchedEvent): void {
    this.pendingRequests.set(getRequestKey(event.request), Date.now());
  }

  private trackBatchedResponse(
    event: ProviderResponseBatchedEventCompat,
  ): void {
    const baseLabels = this.getBaseLabels(event.domain);
    const batched = event.request.length > 1 ? 'true' : 'false';

    this.trackHttpRequest(baseLabels, {
      batched,
      response_code: RPC_METRIC_VALUES.RESPONSE_SUCCESS,
      result: RPC_METRIC_VALUES.RESULT_SUCCESS,
    });

    this.trackResponseTime(event.request, baseLabels);
    this.metrics.httpRpcBatchSize.observe(baseLabels, event.request.length);
    this.trackPayloadSizes(baseLabels, event.request, event.response);
    this.trackRpcCallMetrics(baseLabels, event.request, event.response);
  }

  private trackBatchedErrorResponse(
    event: ProviderResponseBatchedErrorEventCompat,
  ): void {
    const baseLabels = this.getBaseLabels(event.domain);
    const batched = event.request.length > 1 ? 'true' : 'false';

    this.trackHttpRequest(baseLabels, {
      batched,
      response_code: extractHttpErrorCode(event.error),
      result: RPC_METRIC_VALUES.RESULT_FAIL,
    });

    this.trackResponseTime(event.request, baseLabels);
    this.metrics.httpRpcBatchSize.observe(baseLabels, event.request.length);
    this.metrics.httpRpcRequestPayloadBytes.observe(
      baseLabels,
      calculatePayloadSize(event.request),
    );

    this.trackRpcCallFailures(baseLabels, event.request, event.error);
  }

  private trackHttpRequest(
    baseLabels: BaseMetricLabels,
    labels: Pick<HttpRequestLabels, 'batched' | 'response_code' | 'result'>,
  ): void {
    this.metrics.httpRpcRequestsTotal.inc({
      ...baseLabels,
      ...labels,
    });
  }

  private trackResponseTime(
    requests: JsonRpcRequest[],
    baseLabels: BaseMetricLabels,
  ): void {
    const requestKey = getRequestKey(requests);
    const startedAt = this.pendingRequests.get(requestKey);

    if (startedAt === undefined) {
      return;
    }

    const durationSeconds = (Date.now() - startedAt) / 1000;
    this.metrics.httpRpcResponseSeconds.observe(baseLabels, durationSeconds);
    this.pendingRequests.delete(requestKey);

    if (this.pendingRequests.size > 1000) {
      this.cleanupOldRequests();
    }
  }

  private trackRpcCallMetrics(
    baseLabels: BaseMetricLabels,
    requests: JsonRpcRequest[],
    responses: JsonRpcResponse | JsonRpcResponse[] | undefined,
  ): void {
    const responseArray = Array.isArray(responses)
      ? responses
      : responses
      ? [responses]
      : [];
    const responseById = new Map(responseArray.map((r) => [r.id, r]));

    requests.forEach((request) => {
      const response = responseById.get(request.id);
      const rpcErrorCode = response?.error?.code
        ? String(response.error.code)
        : '';
      const methodResult = response?.error
        ? RPC_METRIC_VALUES.RESULT_FAIL
        : RPC_METRIC_VALUES.RESULT_SUCCESS;

      this.metrics.rpcRequestTotal.inc({
        ...baseLabels,
        method: normalizeMethod(request.method),
        result: methodResult,
        rpc_error_code: rpcErrorCode,
      });
    });
  }

  private trackPayloadSizes(
    baseLabels: BaseMetricLabels,
    request: JsonRpcRequest[],
    response?: JsonRpcResponse | JsonRpcResponse[],
  ): void {
    this.metrics.httpRpcRequestPayloadBytes.observe(
      baseLabels,
      calculatePayloadSize(request),
    );

    if (response !== undefined) {
      this.metrics.httpRpcResponsePayloadBytes.observe(
        baseLabels,
        calculatePayloadSize(response),
      );
    }
  }

  private trackRpcCallFailures(
    baseLabels: BaseMetricLabels,
    requests: JsonRpcRequest[],
    error: unknown,
  ): void {
    const rpcErrorCode = extractRpcErrorCode(error);

    requests.forEach((request) => {
      this.metrics.rpcRequestTotal.inc({
        ...baseLabels,
        method: normalizeMethod(request.method),
        result: RPC_METRIC_VALUES.RESULT_FAIL,
        rpc_error_code: rpcErrorCode,
      });
    });
  }

  private getBaseLabels(domain: string): BaseMetricLabels {
    return {
      network: this.options.network,
      layer: this.options.layer,
      chain_id: this.chainId,
      provider: normalizeProvider(domain),
    };
  }

  private cleanupOldRequests(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    for (const [key, timestamp] of this.pendingRequests.entries()) {
      if (timestamp < fiveMinutesAgo) {
        this.pendingRequests.delete(key);
      }
    }
  }

  private createMetrics(): RpcPrometheusMetrics {
    return {
      httpRpcRequestsTotal: this.createCounter(
        RPC_METRIC_NAMES.HTTP_RPC_REQUESTS_TOTAL,
        'Counts total HTTP requests for RPC usage',
        [
          'network',
          'layer',
          'chain_id',
          'provider',
          'batched',
          'response_code',
          'result',
        ],
      ),
      httpRpcBatchSize: this.createHistogram(
        RPC_METRIC_NAMES.HTTP_RPC_BATCH_SIZE,
        'Distribution of JSON-RPC calls per HTTP request',
        ['network', 'layer', 'chain_id', 'provider'],
        RPC_METRIC_BUCKETS.HTTP_BATCH_SIZE,
      ),
      httpRpcResponseSeconds: this.createHistogram(
        RPC_METRIC_NAMES.HTTP_RPC_RESPONSE_SECONDS,
        'Distribution of RPC response times in seconds',
        ['network', 'layer', 'chain_id', 'provider'],
        RPC_METRIC_BUCKETS.HTTP_RESPONSE_SECONDS,
      ),
      httpRpcRequestPayloadBytes: this.createHistogram(
        RPC_METRIC_NAMES.HTTP_RPC_REQUEST_PAYLOAD_BYTES,
        'Distribution of RPC request payload sizes in bytes',
        ['network', 'layer', 'chain_id', 'provider'],
        RPC_METRIC_BUCKETS.HTTP_PAYLOAD_BYTES,
      ),
      httpRpcResponsePayloadBytes: this.createHistogram(
        RPC_METRIC_NAMES.HTTP_RPC_RESPONSE_PAYLOAD_BYTES,
        'Distribution of RPC response payload sizes in bytes',
        ['network', 'layer', 'chain_id', 'provider'],
        RPC_METRIC_BUCKETS.HTTP_PAYLOAD_BYTES,
      ),
      wsRpcConnectionsTotal: this.createCounter(
        RPC_METRIC_NAMES.WS_RPC_CONNECTIONS_TOTAL,
        'Total WebSocket connections opened',
        ['network', 'layer', 'chain_id', 'provider'],
      ),
      wsRpcRequestsTotal: this.createCounter(
        RPC_METRIC_NAMES.WS_RPC_REQUESTS_TOTAL,
        'Number of RPC calls over a WebSocket session',
        ['network', 'layer', 'chain_id', 'provider', 'result'],
      ),
      rpcRequestTotal: this.createCounter(
        RPC_METRIC_NAMES.RPC_REQUEST_TOTAL,
        'Total number of RPC requests',
        [
          'network',
          'layer',
          'chain_id',
          'provider',
          'method',
          'result',
          'rpc_error_code',
        ],
      ),
    };
  }

  private createCounter<T extends string>(
    name: string,
    help: string,
    labelNames: readonly T[],
  ): Counter<T> {
    const existing = this.registry.getSingleMetric(name);
    if (existing) {
      throw new Error(`Metric already exists: ${name}`);
    }

    return new Counter<T>({
      name,
      help,
      labelNames: [...labelNames],
      registers: [this.registry],
    });
  }

  private createHistogram<T extends string>(
    name: string,
    help: string,
    labelNames: readonly T[],
    buckets: readonly number[],
  ): Histogram<T> {
    const existing = this.registry.getSingleMetric(name);
    if (existing) {
      throw new Error(`Metric already exists: ${name}`);
    }

    return new Histogram<T>({
      name,
      help,
      labelNames: [...labelNames],
      buckets: [...buckets],
      registers: [this.registry],
    });
  }
}
