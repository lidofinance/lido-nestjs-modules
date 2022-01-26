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

  public static forRootAsync(options: FetchModuleAsyncOptions) {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: FetchModuleOptions): DynamicModule {
    return {
      module: FetchModule,
      providers: [this.createOptionsProvider(options)],
    };
  }

  public static forFeatureAsync(options: FetchModuleAsyncOptions) {
    return {
      module: FetchModule,
      imports: options.imports || [],
      providers: [this.createAsyncOptionsProvider(options)],
    };
  }

  private static createOptionsProvider(options?: FetchModuleOptions) {
    return {
      provide: FETCH_GLOBAL_OPTIONS_TOKEN,
      useValue: options ?? null,
    };
  }

  private static createAsyncOptionsProvider(options: FetchModuleAsyncOptions) {
    return {
      provide: FETCH_GLOBAL_OPTIONS_TOKEN,
      useFactory: async (...args: unknown[]) =>
        await options.useFactory(...args),
      inject: options.inject,
    };
  }
}
