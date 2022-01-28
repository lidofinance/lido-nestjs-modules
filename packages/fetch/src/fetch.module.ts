import { DynamicModule, Module } from '@nestjs/common';
import { MiddlewareModule } from '@lido-nestjs/middleware';
import { FETCH_GLOBAL_OPTIONS_TOKEN } from './fetch.constants';
import { FetchService } from './fetch.service';
import {
  FetchModuleOptions,
  FetchModuleAsyncOptions,
} from './interfaces/fetch.interface';

@Module({
  imports: [MiddlewareModule],
  providers: [FetchService],
  exports: [FetchService],
})
export class FetchModule {
  static forRoot(options?: FetchModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forRootAsync(options: FetchModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: FetchModuleOptions): DynamicModule {
    return {
      module: FetchModule,
      providers: [
        {
          provide: FETCH_GLOBAL_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
    };
  }

  public static forFeatureAsync(
    options: FetchModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: FetchModule,
      imports: options.imports,
      providers: [
        {
          provide: FETCH_GLOBAL_OPTIONS_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
    };
  }
}
