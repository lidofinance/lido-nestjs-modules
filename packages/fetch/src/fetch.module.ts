import { DynamicModule, Module } from '@nestjs/common';
import { MiddlewareModule } from '@lido-nestjs/middleware';
import {
  FETCH_GLOBAL_URL_PREFIX_TOKEN,
  FETCH_GLOBAL_RETRY_POLICY_TOKEN,
} from './fetch.constants';
import { FetchService } from './fetch.service';
import { FetchModuleOptions } from './interfaces/fetch.interface';

const getFetchModuleProviders = (options?: FetchModuleOptions) => {
  return [
    FetchService,
    {
      provide: FETCH_GLOBAL_URL_PREFIX_TOKEN,
      useValue: options?.baseUrls ?? null,
    },
    {
      provide: FETCH_GLOBAL_RETRY_POLICY_TOKEN,
      useValue: options?.retryPolicy ?? null,
    },
  ];
};

const getFetchModuleImports = (options?: FetchModuleOptions) => {
  return [
    MiddlewareModule.forFeature({
      middlewares: options?.middlewares,
    }),
  ];
};

@Module({})
export class FetchModule {
  static forRoot(options?: FetchModuleOptions): DynamicModule {
    return {
      module: FetchModule,
      global: true,
      imports: getFetchModuleImports(options),
      providers: getFetchModuleProviders(options),
      exports: [FetchService],
    };
  }

  static forFeature(options?: FetchModuleOptions): DynamicModule {
    return {
      module: FetchModule,
      imports: getFetchModuleImports(options),
      providers: getFetchModuleProviders(options),
      exports: [FetchService],
    };
  }
}
