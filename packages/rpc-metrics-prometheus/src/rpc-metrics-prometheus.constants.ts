export const RPC_METRICS_OPTIONS = Symbol('rpc-metrics-prometheus-options');

export const RPC_METRICS_PROVIDER_TOKEN = Symbol(
  'rpc-metrics-prometheus-provider-token',
);

export const RPC_METRIC_NAMES = {
  HTTP_RPC_REQUESTS_TOTAL: 'http_rpc_requests_total',
  HTTP_RPC_BATCH_SIZE: 'http_rpc_batch_size',
  HTTP_RPC_RESPONSE_SECONDS: 'http_rpc_response_seconds',
  HTTP_RPC_REQUEST_PAYLOAD_BYTES: 'http_rpc_request_payload_bytes',
  HTTP_RPC_RESPONSE_PAYLOAD_BYTES: 'http_rpc_response_payload_bytes',
  WS_RPC_CONNECTIONS_TOTAL: 'ws_rpc_connections_total',
  WS_RPC_REQUESTS_TOTAL: 'ws_rpc_requests_total',
  RPC_REQUEST_TOTAL: 'rpc_request_total',
} as const;

export const RPC_METRIC_VALUES = {
  RESULT_SUCCESS: 'success',
  RESULT_FAIL: 'fail',
  RESPONSE_SUCCESS: '2xx',
  RESPONSE_CLIENT_ERROR: '4xx',
  RESPONSE_SERVER_ERROR: '5xx',
  UNKNOWN_PROVIDER: 'unknown',
} as const;

export const RPC_METRIC_BUCKETS = {
  HTTP_BATCH_SIZE: [1, 2, 5, 10, 20, 50, 100, 200],
  HTTP_RESPONSE_SECONDS: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  HTTP_PAYLOAD_BYTES: [
    128, 256, 512, 1024, 2048, 4096, 8192, 16_384, 65_536, 262_144, 1_048_576,
  ],
} as const;
