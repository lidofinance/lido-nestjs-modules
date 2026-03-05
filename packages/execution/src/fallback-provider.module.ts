import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  FallbackProviderModuleAsyncOptions,
  FallbackProviderModuleSyncOptions,
} from './interfaces/module.options';
import { FALLBACK_PROVIDER_MODULE_OPTIONS } from './constants/constants';
import { SimpleFallbackJsonRpcBatchProvider } from './provider/simple-fallback-json-rpc-batch-provider';
import { LoggerService } from '@nestjs/common/services/logger.service';
import { LOGGER_PROVIDER } from '@lido-nestjs/logger';

const getModuleProviders = (
  options: FallbackProviderModuleSyncOptions,
): Provider[] => {
  return [
    {
      provide: SimpleFallbackJsonRpcBatchProvider,
      useFactory: (logger: LoggerService) => {
        return new SimpleFallbackJsonRpcBatchProvider(options, logger);
      },
      inject: [LOGGER_PROVIDER],
    },
  ];
};

@Module({})
export class FallbackProviderModule {
  public static forRoot(
    options: FallbackProviderModuleSyncOptions,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forFeature(
    options: FallbackProviderModuleSyncOptions,
  ): DynamicModule {
    return {
      module: FallbackProviderModule,
      imports: options.imports,
      providers: getModuleProviders(options),
      exports: [SimpleFallbackJsonRpcBatchProvider],
    };
  }

  public static forRootAsync(
    options: FallbackProviderModuleAsyncOptions,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  public static forFeatureAsync(
    options: FallbackProviderModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: FallbackProviderModule,
      imports: options.imports,
      providers: [
        {
          provide: FALLBACK_PROVIDER_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: SimpleFallbackJsonRpcBatchProvider,
          useFactory: (
            logger: LoggerService,
            options: FallbackProviderModuleSyncOptions,
          ) => {
            return new SimpleFallbackJsonRpcBatchProvider(options, logger);
          },
          inject: [LOGGER_PROVIDER, FALLBACK_PROVIDER_MODULE_OPTIONS],
        },
        ...(options.providers || []),
      ],
      exports: [SimpleFallbackJsonRpcBatchProvider],
    };
  }
}
