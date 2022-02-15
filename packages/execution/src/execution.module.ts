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
        );
      },
    },
  ];
};

@Module({})
export class ExecutionModule {
  static forRoot(options: ExecutionModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options: ExecutionModuleSyncOptions): DynamicModule {
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

  static forRootAsync(options: ExecutionModuleAsyncOptions): DynamicModule {
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
          inject: options.inject || [],
        },
        ...(options.providers || []),
      ],
    };
  }
}
