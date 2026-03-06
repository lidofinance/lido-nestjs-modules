export const RPC_METRICS_MODULE_OPTIONS = 'RPC_METRICS_MODULE_OPTIONS';

type CounterMetricDefinition<LabelNames extends readonly string[]> = {
  name: string;
  help: string;
  labelNames: LabelNames;
};

type HistogramMetricDefinition<LabelNames extends readonly string[]> = {
  name: string;
  help: string;
  labelNames: LabelNames;
  buckets: number[];
};

export const HTTP_RPC_REQUESTS_TOTAL_METRIC: CounterMetricDefinition<
  readonly [
    'network',
    'layer',
    'chain_id',
    'provider',
    'batched',
    'response_code',
    'result',
  ]
> = {
  name: 'http_rpc_requests_total',
  help: 'Counts total HTTP requests for RPC usage',
  labelNames: [
    'network',
    'layer',
    'chain_id',
    'provider',
    'batched',
    'response_code',
    'result',
  ],
};

export const HTTP_RPC_BATCH_SIZE_METRIC: HistogramMetricDefinition<
  readonly ['network', 'layer', 'chain_id', 'provider']
> = {
  name: 'http_rpc_batch_size',
  help: 'Distribution of JSON-RPC calls per HTTP request',
  labelNames: ['network', 'layer', 'chain_id', 'provider'],
  buckets: [1, 2, 5, 10, 20, 50, 100, 200],
};

export const HTTP_RPC_RESPONSE_SECONDS_METRIC: HistogramMetricDefinition<
  readonly ['network', 'layer', 'chain_id', 'provider']
> = {
  name: 'http_rpc_response_seconds',
  help: 'RPC service response time in seconds',
  labelNames: ['network', 'layer', 'chain_id', 'provider'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
};

export const HTTP_RPC_REQUEST_PAYLOAD_BYTES_METRIC: HistogramMetricDefinition<
  readonly ['network', 'layer', 'chain_id', 'provider']
> = {
  name: 'http_rpc_request_payload_bytes',
  help: 'Distribution of RPC request payload sizes',
  labelNames: ['network', 'layer', 'chain_id', 'provider'],
  buckets: [
    128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144,
    524288, 1048576,
  ],
};

export const HTTP_RPC_RESPONSE_PAYLOAD_BYTES_METRIC: HistogramMetricDefinition<
  readonly ['network', 'layer', 'chain_id', 'provider']
> = {
  name: 'http_rpc_response_payload_bytes',
  help: 'Distribution of RPC response payload sizes',
  labelNames: ['network', 'layer', 'chain_id', 'provider'],
  buckets: [
    128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144,
    524288, 1048576,
  ],
};

export const RPC_REQUEST_TOTAL_METRIC: CounterMetricDefinition<
  readonly [
    'network',
    'layer',
    'chain_id',
    'provider',
    'method',
    'result',
    'rpc_error_code',
  ]
> = {
  name: 'rpc_request_total',
  help: 'Total RPC requests made by the app',
  labelNames: [
    'network',
    'layer',
    'chain_id',
    'provider',
    'method',
    'result',
    'rpc_error_code',
  ],
};

export const POLICY_COUNTER_METRICS = [
  HTTP_RPC_REQUESTS_TOTAL_METRIC,
  RPC_REQUEST_TOTAL_METRIC,
] as const;

export const POLICY_HISTOGRAM_METRICS = [
  HTTP_RPC_BATCH_SIZE_METRIC,
  HTTP_RPC_RESPONSE_SECONDS_METRIC,
  HTTP_RPC_REQUEST_PAYLOAD_BYTES_METRIC,
  HTTP_RPC_RESPONSE_PAYLOAD_BYTES_METRIC,
] as const;

export const POLICY_METRIC_NAMES = [
  ...POLICY_COUNTER_METRICS,
  ...POLICY_HISTOGRAM_METRICS,
].map(({ name }) => name);
