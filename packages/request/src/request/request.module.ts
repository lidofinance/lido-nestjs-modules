import { DynamicModule, Module } from '@nestjs/common';
import {
  RequestModuleAsyncOptions,
  RequestModuleOptions,
} from '../interfaces/request.interface';
import { REQUEST_GLOBAL_OPTIONS_TOKEN } from './request.constants';
import { RequestService } from './request.service';

@Module({
  imports: [],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {
  static forRoot(options?: RequestModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  public static forRootAsync(
    options: RequestModuleAsyncOptions,
  ): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: RequestModuleOptions): DynamicModule {
    return {
      module: RequestModule,
      providers: [
        {
          provide: REQUEST_GLOBAL_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
    };
  }

  public static forFeatureAsync(
    options: RequestModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: RequestModule,
      imports: options.imports,
      providers: [
        {
          provide: REQUEST_GLOBAL_OPTIONS_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
    };
  }
}
