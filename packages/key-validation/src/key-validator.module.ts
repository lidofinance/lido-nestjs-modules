import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  KeyValidatorInterface,
  KeyValidatorExecutorInterface,
} from './interfaces';
import {
  KeyValidatorModuleOptions,
  KeyValidatorModuleSyncOptions,
} from './interfaces/module.options';
import {
  KeyValidator,
  SingleThreadedKeyValidatorExecutor,
  MultiThreadedKeyValidatorExecutor,
} from './services';

export const getDefaultKeyValidatorModuleProviders = (
  options?: KeyValidatorModuleOptions,
): Provider[] => [
  {
    provide: KeyValidatorInterface,
    useClass: KeyValidator,
  },
  {
    provide: KeyValidatorExecutorInterface,
    useClass: options
      ? options.multithreaded
        ? MultiThreadedKeyValidatorExecutor
        : SingleThreadedKeyValidatorExecutor
      : MultiThreadedKeyValidatorExecutor,
  },
];

@Module({})
export class KeyValidatorModule {
  static forRoot(options?: KeyValidatorModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options?: KeyValidatorModuleSyncOptions): DynamicModule {
    return {
      imports: [],
      module: KeyValidatorModule,
      providers: getDefaultKeyValidatorModuleProviders(options),
      exports: [KeyValidatorInterface],
    };
  }
}
