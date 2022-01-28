import { DynamicModule, Module } from '@nestjs/common';
import {
  ConsensusModuleSyncOptions,
  ConsensusModuleAsyncOptions,
} from './interfaces/module.interface';
import { ConsensusService } from './service/consensus.service';
import { CONSENSUS_OPTIONS_TOKEN } from './consensus.constants';

@Module({
  providers: [ConsensusService],
  exports: [ConsensusService],
})
export class ConsensusModule {
  static forRoot(options?: ConsensusModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forRootAsync(options: ConsensusModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: ConsensusModuleSyncOptions): DynamicModule {
    const { imports, ...serviceOptions } = options || {};

    return {
      module: ConsensusModule,
      imports,
      providers: [
        {
          provide: CONSENSUS_OPTIONS_TOKEN,
          useValue: serviceOptions,
        },
      ],
    };
  }

  public static forFeatureAsync(
    options: ConsensusModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: ConsensusModule,
      imports: options.imports,
      providers: [
        {
          provide: CONSENSUS_OPTIONS_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
    };
  }
}
