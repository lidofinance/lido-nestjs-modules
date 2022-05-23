import { DynamicModule, Module } from '@nestjs/common';
import {
  RegistryModuleSyncOptions,
  RegistryModuleAsyncOptions,
} from '../interfaces/module.interface';
import { ValidatorRegistryService } from './validator-registry.service';
import { RegistryStorageModule } from '../../storage/registry-storage.module';
import { RegistryFetchModule } from '../../fetch/registry-fetch.module';

@Module({
  imports: [RegistryStorageModule],
  providers: [ValidatorRegistryService],
  exports: [ValidatorRegistryService],
})
export class ValidatorRegistryModule {
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
      module: ValidatorRegistryModule,
      imports: [
        ...(options?.imports || []),
        RegistryFetchModule.forFeature(options),
      ],
    };
  }

  public static forFeatureAsync(
    options: RegistryModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: ValidatorRegistryModule,
      imports: [
        ...(options.imports || []),
        RegistryFetchModule.forFeatureAsync(options),
      ],
    };
  }
}
