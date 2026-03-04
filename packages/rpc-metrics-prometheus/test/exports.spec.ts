import * as packageExports from '../src';

describe('rpc metrics package exports', () => {
  test('should expose public API symbols', () => {
    expect(packageExports.RpcMetricsPrometheusModule).toBeDefined();
    expect(packageExports.RpcMetricsPrometheusService).toBeDefined();
    expect(packageExports.RPC_METRICS_OPTIONS).toBeDefined();
    expect(packageExports.RPC_METRICS_PROVIDER_TOKEN).toBeDefined();
  });
});
