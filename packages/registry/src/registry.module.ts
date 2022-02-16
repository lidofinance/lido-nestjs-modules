import { DynamicModule, Module } from '@nestjs/common';
import {
  RegistryModuleSyncOptions,
  RegistryModuleAsyncOptions,
} from './interfaces/module.interface';
import { RegistryService } from './registry.service';
import { REGISTRY_OPTIONS_TOKEN } from './registry.constants';

@Module({
  providers: [RegistryService],
  exports: [RegistryService],
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
    const { imports, ...serviceOptions } = options || {};

    return {
      module: RegistryModule,
      imports,
      providers: [
        {
          provide: REGISTRY_OPTIONS_TOKEN,
          useValue: serviceOptions,
        },
      ],
    };
  }

  public static forFeatureAsync(
    options: RegistryModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: RegistryModule,
      imports: options.imports,
      providers: [
        {
          provide: REGISTRY_OPTIONS_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
    };
  }
}
