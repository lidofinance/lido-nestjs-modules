import { DynamicModule, Module } from '@nestjs/common';
import {
  MiddlewareModuleOptions,
  MiddlewareModuleAsyncOptions,
} from './interfaces/middleware.interface';
import { MIDDLEWARE_OPTIONS_TOKEN } from './middleware.constants';
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
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forRootAsync<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ): DynamicModule {
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
      providers: [
        {
          provide: MIDDLEWARE_OPTIONS_TOKEN,
          useValue: options ?? null,
        },
      ],
    };
  }

  public static forFeatureAsync<T = unknown>(
    options: MiddlewareModuleAsyncOptions<T>,
  ): DynamicModule {
    return {
      module: MiddlewareModule,
      imports: options.imports,
      providers: [
        {
          provide: MIDDLEWARE_OPTIONS_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
    };
  }
}
