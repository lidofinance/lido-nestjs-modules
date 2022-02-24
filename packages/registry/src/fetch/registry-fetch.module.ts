import { DynamicModule, Module } from '@nestjs/common';
import {
  RegistryFetchModuleSyncOptions,
  RegistryFetchModuleAsyncOptions,
} from './interfaces/module.interface';
import { RegistryOperatorFetchService } from './operator.fetch';
import { RegistryMetaFetchService } from './meta.fetch';
import { RegistryKeyFetchService } from './key.fetch';
import { RegistryFetchService } from './registry-fetch.service';

@Module({
  providers: [
    RegistryFetchService,
    RegistryOperatorFetchService,
    RegistryMetaFetchService,
    RegistryKeyFetchService,
  ],
  exports: [
    RegistryFetchService,
    RegistryOperatorFetchService,
    RegistryMetaFetchService,
    RegistryKeyFetchService,
  ],
})
export class RegistryFetchModule {
  static forRoot(options?: RegistryFetchModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forRootAsync(options: RegistryFetchModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: RegistryFetchModuleSyncOptions): DynamicModule {
    return {
      module: RegistryFetchModule,
      imports: options?.imports,
    };
  }

  public static forFeatureAsync(
    options: RegistryFetchModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: RegistryFetchModule,
      imports: options.imports,
    };
  }
}
