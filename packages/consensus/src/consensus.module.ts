import { DynamicModule, Module } from '@nestjs/common';
import { FetchModule } from '@lido-nestjs/fetch';
import {
  CONSENSUS_API_POOL_INTERVAL_DEFAULT_MS,
  CONSENSUS_API_POOL_INTERVAL_TOKEN,
} from './consensus.constants';
import { ConsensusModuleOptions } from './interfaces';
import { ConsensusService } from './service';

@Module({})
export class ConsensusModule {
  static forRoot(options: ConsensusModuleOptions): DynamicModule {
    const { baseUrls, retryPolicy, poolInterval } = options;

    return {
      global: true,
      module: ConsensusModule,
      imports: [
        FetchModule.forFeature({
          baseUrls,
          retryPolicy,
        }),
      ],
      providers: [
        ConsensusService,
        {
          // TODO: add subscription support
          provide: CONSENSUS_API_POOL_INTERVAL_TOKEN,
          useValue: poolInterval ?? CONSENSUS_API_POOL_INTERVAL_DEFAULT_MS,
        },
      ],
      exports: [ConsensusService],
    };
  }
}
