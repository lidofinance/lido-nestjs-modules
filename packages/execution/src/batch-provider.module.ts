import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ExtendedJsonRpcBatchProvider } from './provider/extended-json-rpc-batch-provider';
import {
  BatchProviderModuleAsyncOptions,
  BatchProviderModuleSyncOptions,
} from './interfaces/module.options';
import { BATCH_PROVIDER_MODULE_OPTIONS } from './constants/constants';

const getModuleProviders = (
  options: BatchProviderModuleSyncOptions,
): Provider[] => {
  return [
    {
      provide: ExtendedJsonRpcBatchProvider,
      useFactory: () => {
        return new ExtendedJsonRpcBatchProvider(
          options.url,
          options.network,
          options.requestPolicy,
          options.fetchMiddlewares,
        );
      },
    },
  ];
};

@Module({})
export class BatchProviderModule {
  public static forRoot(
    options: BatchProviderModuleSyncOptions,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forFeature(
    options: BatchProviderModuleSyncOptions,
  ): DynamicModule {
    return {
      module: BatchProviderModule,
      imports: options.imports,
      providers: getModuleProviders(options),
      exports: [ExtendedJsonRpcBatchProvider],
    };
  }

  public static forRootAsync(
    options: BatchProviderModuleAsyncOptions,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  public static forFeatureAsync(
    options: BatchProviderModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: BatchProviderModule,
      imports: options.imports,
      providers: [
        {
          provide: BATCH_PROVIDER_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: ExtendedJsonRpcBatchProvider,
          useFactory: (options: BatchProviderModuleSyncOptions) => {
            return new ExtendedJsonRpcBatchProvider(
              options.url,
              options.network,
              options.requestPolicy,
              options.fetchMiddlewares,
            );
          },
          inject: [BATCH_PROVIDER_MODULE_OPTIONS],
        },
        ...(options.providers || []),
      ],
      exports: [ExtendedJsonRpcBatchProvider],
    };
  }
}
