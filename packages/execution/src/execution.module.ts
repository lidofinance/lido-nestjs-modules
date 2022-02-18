import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ExtendedJsonRpcBatchProvider } from './provider/extended-json-rpc-batch-provider';
import {
  ExecutionModuleAsyncOptions,
  ExecutionModuleSyncOptions,
} from './interfaces/module.options';
import { EXECUTION_MODULE_OPTIONS } from './constants/constants';
import { SimpleFallbackJsonRpcBatchProvider } from './provider/simple-fallback-json-rpc-batch-provider';
import { LoggerService } from '@nestjs/common/services/logger.service';
import { LOGGER_PROVIDER } from '@lido-nestjs/logger';

const getModuleProviders = (
  options: ExecutionModuleSyncOptions,
): Provider[] => {
  return [
    {
      provide: SimpleFallbackJsonRpcBatchProvider,
      useFactory: (logger: LoggerService) => {
        return new SimpleFallbackJsonRpcBatchProvider(options, logger);
      },
      inject: [LOGGER_PROVIDER],
    },
    {
      provide: ExtendedJsonRpcBatchProvider,
      useFactory: () => {
        return new ExtendedJsonRpcBatchProvider(
          options.urls[0],
          undefined, // options.network,
          options.requestPolicy,
          options.fetchMiddlewares,
        );
      },
    },
  ];
};

@Module({})
export class ExecutionModule {
  public static forRoot(options: ExecutionModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forFeature(options: ExecutionModuleSyncOptions): DynamicModule {
    return {
      module: ExecutionModule,
      imports: options.imports,
      providers: getModuleProviders(options),
      exports: [
        SimpleFallbackJsonRpcBatchProvider,
        ExtendedJsonRpcBatchProvider,
      ],
    };
  }

  public static forRootAsync(
    options: ExecutionModuleAsyncOptions,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  public static forFeatureAsync(
    options: ExecutionModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: ExecutionModule,
      imports: options.imports,
      providers: [
        {
          provide: EXECUTION_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: SimpleFallbackJsonRpcBatchProvider,
          useFactory: (
            logger: LoggerService,
            options: ExecutionModuleSyncOptions,
          ) => {
            return new SimpleFallbackJsonRpcBatchProvider(options, logger);
          },
          inject: [LOGGER_PROVIDER, EXECUTION_MODULE_OPTIONS],
        },
        {
          provide: ExtendedJsonRpcBatchProvider,
          useFactory: (options: ExecutionModuleSyncOptions) => {
            return new ExtendedJsonRpcBatchProvider(
              options.urls[0],
              undefined, // options.network,
              options.requestPolicy,
            );
          },
          inject: [EXECUTION_MODULE_OPTIONS],
        },
        ...(options.providers || []),
      ],
      exports: [
        SimpleFallbackJsonRpcBatchProvider,
        ExtendedJsonRpcBatchProvider,
      ],
    };
  }
}
