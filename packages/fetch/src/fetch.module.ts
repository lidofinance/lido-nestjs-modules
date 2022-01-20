import { DynamicModule, Module } from '@nestjs/common';
import { FETCH_GLOBAL_URL_PREFIX_TOKEN } from './fetch.constants';
import { FetchService } from './fetch.service';
import { FetchModuleOptions } from './interfaces';

const getFetchModuleProviders = (options: FetchModuleOptions) => {
  return [
    FetchService,
    {
      provide: FETCH_GLOBAL_URL_PREFIX_TOKEN,
      useValue: options.globalPrefix,
    },
  ];
};

@Module({})
export class FetchModule {
  static forRoot(options: FetchModuleOptions): DynamicModule {
    return {
      module: FetchModule,
      global: true,
      providers: getFetchModuleProviders(options),
      exports: [FetchService],
    };
  }

  static forFeature(options: FetchModuleOptions): DynamicModule {
    return {
      module: FetchModule,
      providers: getFetchModuleProviders(options),
      exports: [FetchService],
    };
  }
}
