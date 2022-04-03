import { DynamicModule, Module } from '@nestjs/common';
import {
  RegistryModuleSyncOptions,
  RegistryModuleAsyncOptions,
} from './interfaces/module.interface';
import { RegistryFetchModule } from '../fetch/registry-fetch.module';
import { RegistryStorageModule } from '../storage/registry-storage.module';

@Module({
  imports: [RegistryFetchModule, RegistryStorageModule],
})
export class RegistryModule {
  static forRoot(options?: RegistryModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forRootAsync(options: RegistryModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: RegistryModuleSyncOptions): DynamicModule {
    return {
      module: RegistryFetchModule,
      imports: options?.imports,
    };
  }

  public static forFeatureAsync(
    options: RegistryModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: RegistryFetchModule,
      imports: options.imports,
    };
  }
}
