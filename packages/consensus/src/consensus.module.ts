import { DynamicModule, Module } from '@nestjs/common';
import {
  CONSENSUS_API_POOL_INTERVAL_DEFAULT_MS,
  CONSENSUS_API_POOL_INTERVAL_TOKEN,
  CONSENSUS_API_URL_TOKEN,
} from './consensus.constants';
import { ConsensusModuleOptions } from './interfaces';
import { ConsensusService } from './service';

@Module({})
export class ConsensusModule {
  static forRoot(options: ConsensusModuleOptions): DynamicModule {
    const { apiUrl, poolInterval } = options;

    return {
      global: true,
      module: ConsensusModule,
      providers: [
        ConsensusService,
        {
          provide: CONSENSUS_API_URL_TOKEN,
          useValue: apiUrl,
        },
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
