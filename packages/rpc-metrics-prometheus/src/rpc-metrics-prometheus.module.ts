import { DynamicModule, Module } from '@nestjs/common';
import { SimpleFallbackJsonRpcBatchProvider } from '@lido-nestjs/execution';
import { RpcMetricsPrometheusService } from './rpc-metrics-prometheus.service';
import {
  RpcMetricsPrometheusAsyncOptions,
  RpcMetricsPrometheusFeatureAsyncOptions,
  RpcMetricsPrometheusFeatureOptions,
  RpcMetricsPrometheusOptions,
} from './rpc-metrics-prometheus.interfaces';
import {
  RPC_METRICS_OPTIONS,
  RPC_METRICS_PROVIDER_TOKEN,
} from './rpc-metrics-prometheus.constants';

@Module({})
export class RpcMetricsPrometheusModule {
  public static forRoot(options: RpcMetricsPrometheusOptions): DynamicModule {
    return {
      global: true,
      module: RpcMetricsPrometheusModule,
      providers: [
        {
          provide: RPC_METRICS_OPTIONS,
          useValue: options,
        },
        {
          provide: RPC_METRICS_PROVIDER_TOKEN,
          useExisting: SimpleFallbackJsonRpcBatchProvider,
        },
        RpcMetricsPrometheusService,
      ],
      exports: [RpcMetricsPrometheusService],
    };
  }

  public static forRootAsync(
    options: RpcMetricsPrometheusAsyncOptions,
  ): DynamicModule {
    return {
      global: true,
      module: RpcMetricsPrometheusModule,
      imports: options.imports,
      providers: [
        {
          provide: RPC_METRICS_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: RPC_METRICS_PROVIDER_TOKEN,
          useExisting: SimpleFallbackJsonRpcBatchProvider,
        },
        RpcMetricsPrometheusService,
        ...(options.providers ?? []),
      ],
      exports: [RpcMetricsPrometheusService],
    };
  }

  public static forFeature(
    options: RpcMetricsPrometheusFeatureOptions,
  ): DynamicModule {
    const { providerToken, ...metricOptions } = options;

    return {
      module: RpcMetricsPrometheusModule,
      providers: [
        {
          provide: RPC_METRICS_OPTIONS,
          useValue: metricOptions,
        },
        {
          provide: RPC_METRICS_PROVIDER_TOKEN,
          useExisting: providerToken,
        },
        RpcMetricsPrometheusService,
      ],
      exports: [RpcMetricsPrometheusService],
    };
  }

  public static forFeatureAsync(
    options: RpcMetricsPrometheusFeatureAsyncOptions,
  ): DynamicModule {
    return {
      module: RpcMetricsPrometheusModule,
      imports: options.imports,
      providers: [
        {
          provide: RPC_METRICS_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: RPC_METRICS_PROVIDER_TOKEN,
          useExisting: options.providerToken,
        },
        RpcMetricsPrometheusService,
        ...(options.providers ?? []),
      ],
      exports: [RpcMetricsPrometheusService],
    };
  }
}
