import { Module, DynamicModule } from '@nestjs/common';
import { FetchService } from '@lido-nestjs/fetch';
import {
  IpfsModuleOptions,
  IpfsModuleOptionsAsync,
} from './interfaces/ipfs-module-options';
import { IpfsGeneralService } from './ipfs.general.service';

@Module({})
export class IpfsModule {
  static forRoot(options: IpfsModuleOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forRootAsync(options: IpfsModuleOptionsAsync): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options: IpfsModuleOptions): DynamicModule {
    const { imports, ...opts } = options;
    return {
      module: IpfsModule,
      imports,
      providers: [
        {
          provide: IpfsGeneralService,
          // FetchServiceInterface
          useFactory: (fetchService: FetchService) => {
            return new IpfsGeneralService(
              fetchService,
              opts.url,
              opts.username,
              opts.password,
            );
          },
          inject: [FetchService],
        },
      ],
      exports: [IpfsGeneralService],
    };
  }

  public static forFeatureAsync(
    options: IpfsModuleOptionsAsync,
  ): DynamicModule {
    const { imports } = options;

    return {
      module: IpfsModule,
      imports,
      providers: [
        {
          provide: IpfsModuleOptions,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: IpfsGeneralService,
          useFactory: (
            fetchService: FetchService,
            ipfsModuleOptions: IpfsModuleOptions,
          ) => {
            return new IpfsGeneralService(
              fetchService,
              ipfsModuleOptions.url,
              ipfsModuleOptions.username,
              ipfsModuleOptions.password,
            );
          },
          inject: [FetchService, IpfsModuleOptions],
        },
      ],
      exports: [IpfsGeneralService],
    };
  }
}
