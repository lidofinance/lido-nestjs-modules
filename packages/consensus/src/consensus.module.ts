import { DynamicModule, Module } from '@nestjs/common';
import { FetchModule } from '@lido-nestjs/fetch';
import {
  CONSENSUS_API_POOL_INTERVAL_DEFAULT_MS,
  CONSENSUS_API_POOL_INTERVAL_TOKEN,
} from './consensus.constants';
import { ConsensusModuleOptions } from './interfaces';
import { ConsensusService } from './service';

const getConsensusModuleImports = (options?: ConsensusModuleOptions) => {
  const { baseUrls, retryPolicy } = options || {};
  return [FetchModule.forFeature({ baseUrls, retryPolicy })];
};

const getConsensusModuleProviders = (options?: ConsensusModuleOptions) => {
  return [
    ConsensusService,
    {
      // TODO: add subscription support
      provide: CONSENSUS_API_POOL_INTERVAL_TOKEN,
      useValue: options?.poolInterval ?? CONSENSUS_API_POOL_INTERVAL_DEFAULT_MS,
    },
  ];
};

@Module({})
export class ConsensusModule {
  static forRoot(options?: ConsensusModuleOptions): DynamicModule {
    return {
      global: true,
      module: ConsensusModule,
      imports: getConsensusModuleImports(options),
      providers: getConsensusModuleProviders(options),
      exports: [ConsensusService],
    };
  }

  static forFeature(options?: ConsensusModuleOptions): DynamicModule {
    return {
      module: ConsensusModule,
      imports: getConsensusModuleImports(options),
      providers: getConsensusModuleProviders(options),
      exports: [ConsensusService],
    };
  }
}
