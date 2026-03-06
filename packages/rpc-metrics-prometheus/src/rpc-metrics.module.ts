import { DynamicModule, Module } from '@nestjs/common';
import { SimpleFallbackJsonRpcBatchProvider } from '@lido-nestjs/execution';
import {
  RpcMetricsModuleAsyncOptions,
  RpcMetricsModuleResolvedOptions,
  RpcMetricsModuleSyncOptions,
} from './interfaces/module.options';
import { RPC_METRICS_MODULE_OPTIONS } from './rpc-metrics.constants';
import { RpcMetricsService } from './rpc-metrics.service';

const resolveOptions = (
  options: Pick<
    RpcMetricsModuleSyncOptions,
    'providerToken' | 'labels' | 'registry'
  >,
): RpcMetricsModuleResolvedOptions => {
  return {
    ...options,
    providerToken: options.providerToken ?? SimpleFallbackJsonRpcBatchProvider,
  };
};

@Module({})
export class RpcMetricsModule {
  public static forRoot(options: RpcMetricsModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forFeature(
    options: RpcMetricsModuleSyncOptions,
  ): DynamicModule {
    const { imports, providerToken, ...moduleOptions } = options;

    return {
      module: RpcMetricsModule,
      imports,
      providers: [
        {
          provide: RPC_METRICS_MODULE_OPTIONS,
          useValue: resolveOptions({
            ...moduleOptions,
            providerToken,
          }),
        },
        RpcMetricsService,
      ],
    };
  }

  public static forRootAsync(
    options: RpcMetricsModuleAsyncOptions,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  public static forFeatureAsync(
    options: RpcMetricsModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: RpcMetricsModule,
      imports: options.imports,
      providers: [
        {
          provide: RPC_METRICS_MODULE_OPTIONS,
          useFactory: async (...args: unknown[]) => {
            const resolvedOptions = await options.useFactory(...args);
            return resolveOptions({
              ...resolvedOptions,
              providerToken: options.providerToken,
            });
          },
          inject: options.inject,
        },
        RpcMetricsService,
        ...(options.providers || []),
      ],
    };
  }
}
