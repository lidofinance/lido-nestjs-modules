import { DynamicModule, Module } from '@nestjs/common';
import { MiddlewareModuleOptions } from './interfaces/middleware.interface';
import { MIDDLEWARE_INITIAL } from './middleware.constants';
import { MiddlewareService } from './middleware.service';

const getMiddlewareModuleProviders = <T>(
  options?: MiddlewareModuleOptions<T>,
) => {
  return [
    MiddlewareService,
    {
      provide: MIDDLEWARE_INITIAL,
      useValue: options?.middlewares ?? null,
    },
  ];
};

@Module({})
export class MiddlewareModule {
  static forRoot<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ): DynamicModule {
    return {
      module: MiddlewareModule,
      global: true,
      providers: getMiddlewareModuleProviders(options),
      exports: [MiddlewareService],
    };
  }

  static forFeature<T = unknown>(
    options?: MiddlewareModuleOptions<T>,
  ): DynamicModule {
    return {
      module: MiddlewareModule,
      providers: getMiddlewareModuleProviders(options),
      exports: [MiddlewareService],
    };
  }
}
