import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ExtendedJsonRpcBatchProvider } from './provider/extended-json-rpc-batch-provider';
import {
  ExecutionModuleAsyncOptions,
  ExecutionModuleOptions,
  ExecutionModuleOptionsFactory,
} from './interfaces/execution.module.options';
import { EXECUTION_MODULE_OPTIONS } from './constants/constants';

@Module({})
export class ExecutionModule {
  static forRoot(options: ExecutionModuleOptions): DynamicModule {
    return {
      module: ExecutionModule,
      global: true,
      imports: [],
      providers: [
        {
          provide: ExtendedJsonRpcBatchProvider,
          useFactory: () => {
            return new ExtendedJsonRpcBatchProvider(
              options.url,
              options.network,
              options.requestPolicy,
            );
          },
        },
      ],
      exports: [ExtendedJsonRpcBatchProvider],
    };
  }

  static forFeature(options: ExecutionModuleOptions): DynamicModule {
    return {
      module: ExecutionModule,
      imports: [],
      providers: [
        {
          provide: ExtendedJsonRpcBatchProvider,
          useFactory: () => {
            return new ExtendedJsonRpcBatchProvider(
              options.url,
              options.network,
              options.requestPolicy,
            );
          },
        },
      ],
      exports: [ExtendedJsonRpcBatchProvider],
    };
  }

  static forRootAsync(options: ExecutionModuleAsyncOptions): DynamicModule {
    return {
      module: ExecutionModule,
      imports: options.imports,
      providers: [...(options.providers || [])],
      exports: [ExtendedJsonRpcBatchProvider],
    };
  }
}

export const createAsyncProviders = (
  options: ExecutionModuleAsyncOptions,
): Provider[] => {
  if (options.useExisting || options.useFactory) {
    return [createExecutionOptionsProvider(options)];
  }

  if (options.useClass) {
    return [
      createExecutionOptionsProvider(options),
      { provide: options.useClass, useClass: options.useClass },
    ];
  }

  throw new Error(
    'Invalid Execution module async options: one of `useClass`, `useExisting` or `useFactory` should be defined.',
  );
};

export const createExecutionOptionsProvider = (
  options: ExecutionModuleAsyncOptions,
): Provider => {
  if (options.useFactory) {
    return {
      provide: EXECUTION_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }

  const inject = [];

  if (options.useClass || options.useExisting) {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    inject.push(options.useClass ?? options.useExisting!);
  }

  return {
    provide: EXECUTION_MODULE_OPTIONS,
    useFactory: async (optionsFactory: ExecutionModuleOptionsFactory) =>
      await optionsFactory.createExecutionModuleOptions(),
    inject,
  };
};
