import { SimpleFallbackJsonRpcBatchProvider } from '@lido-nestjs/execution';
import {
  RPC_METRICS_OPTIONS,
  RPC_METRICS_PROVIDER_TOKEN,
} from '../src/rpc-metrics-prometheus.constants';
import { RpcMetricsPrometheusModule } from '../src/rpc-metrics-prometheus.module';
import { RpcMetricsPrometheusService } from '../src/rpc-metrics-prometheus.service';

describe('RpcMetricsPrometheusModule', () => {
  test('forRoot should build global module with default provider token', () => {
    const moduleDef = RpcMetricsPrometheusModule.forRoot({
      network: 'ethereum',
      layer: 'el',
      chainId: 1,
    });

    expect(moduleDef.global).toBe(true);
    expect(moduleDef.module).toBe(RpcMetricsPrometheusModule);

    const providers = moduleDef.providers || [];
    expect(providers).toHaveLength(3);

    expect(providers[0]).toEqual({
      provide: RPC_METRICS_OPTIONS,
      useValue: {
        network: 'ethereum',
        layer: 'el',
        chainId: 1,
      },
    });

    expect(providers[1]).toEqual({
      provide: RPC_METRICS_PROVIDER_TOKEN,
      useExisting: SimpleFallbackJsonRpcBatchProvider,
    });

    expect(providers[2]).toBe(RpcMetricsPrometheusService);
    expect(moduleDef.exports).toEqual([RpcMetricsPrometheusService]);
  });

  test('forRootAsync should include async options and custom providers', () => {
    const customProvider = {
      provide: 'CUSTOM_PROVIDER',
      useValue: true,
    };

    const moduleDef = RpcMetricsPrometheusModule.forRootAsync({
      imports: ['IMPORT' as never],
      inject: ['CONFIG'],
      providers: [customProvider],
      useFactory: () => ({
        network: 'ethereum',
        layer: 'el',
        chainId: '1',
      }),
    });

    expect(moduleDef.global).toBe(true);
    expect(moduleDef.module).toBe(RpcMetricsPrometheusModule);
    expect(moduleDef.imports).toEqual(['IMPORT']);

    const providers = moduleDef.providers || [];
    expect(providers).toHaveLength(4);

    expect(providers[0]).toMatchObject({
      provide: RPC_METRICS_OPTIONS,
      inject: ['CONFIG'],
    });
    expect(typeof (providers[0] as { useFactory: unknown }).useFactory).toBe(
      'function',
    );

    expect(providers[1]).toEqual({
      provide: RPC_METRICS_PROVIDER_TOKEN,
      useExisting: SimpleFallbackJsonRpcBatchProvider,
    });

    expect(providers[2]).toBe(RpcMetricsPrometheusService);
    expect(providers[3]).toBe(customProvider);
  });

  test('forRootAsync should work without extra providers', () => {
    const moduleDef = RpcMetricsPrometheusModule.forRootAsync({
      useFactory: () => ({
        network: 'ethereum',
        layer: 'el',
        chainId: '1',
      }),
    });

    expect(moduleDef.global).toBe(true);
    const providers = moduleDef.providers || [];
    expect(providers).toHaveLength(3);
  });

  test('forFeature should use explicit provider token', () => {
    const moduleDef = RpcMetricsPrometheusModule.forFeature({
      providerToken: 'CUSTOM_RPC_PROVIDER',
      network: 'ethereum',
      layer: 'el',
      chainId: 1,
    });

    expect(moduleDef.module).toBe(RpcMetricsPrometheusModule);

    const providers = moduleDef.providers || [];
    expect(providers).toHaveLength(3);

    expect(providers[0]).toEqual({
      provide: RPC_METRICS_OPTIONS,
      useValue: {
        network: 'ethereum',
        layer: 'el',
        chainId: 1,
      },
    });

    expect(providers[1]).toEqual({
      provide: RPC_METRICS_PROVIDER_TOKEN,
      useExisting: 'CUSTOM_RPC_PROVIDER',
    });

    expect(providers[2]).toBe(RpcMetricsPrometheusService);
  });

  test('forFeatureAsync should build module without extra providers', () => {
    const moduleDef = RpcMetricsPrometheusModule.forFeatureAsync({
      imports: ['IMPORT' as never],
      inject: ['CONFIG'],
      providerToken: 'CUSTOM_RPC_PROVIDER',
      useFactory: () => ({
        network: 'ethereum',
        layer: 'el',
        chainId: 1,
      }),
    });

    expect(moduleDef.module).toBe(RpcMetricsPrometheusModule);
    expect(moduleDef.imports).toEqual(['IMPORT']);

    const providers = moduleDef.providers || [];
    expect(providers).toHaveLength(3);

    expect(providers[0]).toMatchObject({
      provide: RPC_METRICS_OPTIONS,
      inject: ['CONFIG'],
    });

    expect(providers[1]).toEqual({
      provide: RPC_METRICS_PROVIDER_TOKEN,
      useExisting: 'CUSTOM_RPC_PROVIDER',
    });

    expect(providers[2]).toBe(RpcMetricsPrometheusService);
  });

  test('forFeatureAsync should append extra providers', () => {
    const customProvider = {
      provide: 'CUSTOM_PROVIDER',
      useValue: true,
    };

    const moduleDef = RpcMetricsPrometheusModule.forFeatureAsync({
      providerToken: 'CUSTOM_RPC_PROVIDER',
      providers: [customProvider],
      useFactory: () => ({
        network: 'ethereum',
        layer: 'el',
        chainId: 1,
      }),
    });

    const providers = moduleDef.providers || [];
    expect(providers).toHaveLength(4);
    expect(providers[3]).toBe(customProvider);
  });
});
