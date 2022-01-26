import { DynamicModule, Module } from '@nestjs/common';
import {
  MiddlewareModuleOptions,
  MiddlewareModuleAsyncOptions,
} from './interfaces/middleware.interface';
import { MIDDLEWARE_OPTIONS_TOKEN } from './middleware.constants';
import { MiddlewareService } from './middleware.service';

@Module({
  providers: [
    MiddlewareService,
    {
      provide: MIDDLEWARE_OPTIONS_TOKEN,
      useValue: null,
    },
  ],
  exports: [MiddlewareService],
})
export class MiddlewareModule {
  public static forRoot<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forRootAsync<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ) {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  public static forFeature<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ): DynamicModule {
    return {
      module: MiddlewareModule,
      providers: [this.createOptionsProvider(options)],
    };
  }

  public static forFeatureAsync<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ) {
    return {
      module: MiddlewareModule,
      imports: options.imports,
      providers: [this.createAsyncOptionsProvider(options)],
    };
  }

  private static createOptionsProvider<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ) {
    return {
      provide: MIDDLEWARE_OPTIONS_TOKEN,
      useValue: options ?? null,
    };
  }

  private static createAsyncOptionsProvider<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ) {
    return {
      provide: MIDDLEWARE_OPTIONS_TOKEN,
      useFactory: async (...args: unknown[]) =>
        await options.useFactory(...args),
      inject: options.inject,
    };
  }
}
