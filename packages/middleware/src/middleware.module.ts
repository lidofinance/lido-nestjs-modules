import { DynamicModule, Module } from '@nestjs/common';
import {
  MiddlewareModuleOptions,
  MiddlewareModuleAsyncOptions,
} from './interfaces/middleware.interface';
import { MIDDLEWARE_OPTIONS } from './middleware.constants';
import { MiddlewareService } from './middleware.service';

@Module({
  providers: [MiddlewareService],
  exports: [MiddlewareService],
})
export class MiddlewareModule {
  public static forRoot<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ): DynamicModule {
    return {
      module: MiddlewareModule,
      global: true,
      providers: [MiddlewareService, this.createOptionsProvider(options)],
      exports: [MiddlewareService],
    };
  }

  public static forRootAsync<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ) {
    return {
      module: MiddlewareModule,
      global: true,
      imports: options.imports,
      providers: [MiddlewareService, this.createAsyncOptionsProvider(options)],
      exports: [MiddlewareService],
    };
  }

  public static forFeature<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ): DynamicModule {
    return {
      module: MiddlewareModule,
      providers: [MiddlewareService, this.createOptionsProvider(options)],
      exports: [MiddlewareService],
    };
  }

  public static forFeatureAsync<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ) {
    return {
      module: MiddlewareModule,
      imports: options.imports,
      providers: [MiddlewareService, this.createAsyncOptionsProvider(options)],
      exports: [MiddlewareService],
    };
  }

  private static createOptionsProvider<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ) {
    return {
      provide: MIDDLEWARE_OPTIONS,
      useValue: options ?? null,
    };
  }

  private static createAsyncOptionsProvider<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ) {
    return {
      provide: MIDDLEWARE_OPTIONS,
      useFactory: async (...args: unknown[]) =>
        await options.useFactory(...args),
      inject: options.inject,
    };
  }
}
