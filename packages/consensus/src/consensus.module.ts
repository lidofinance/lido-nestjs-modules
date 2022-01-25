import { DynamicModule, Module } from '@nestjs/common';
import { FetchModule } from '@lido-nestjs/fetch';

import { ConsensusModuleOptions } from './interfaces';
import { ConsensusService } from './service';

const getConsensusModuleImports = (options?: ConsensusModuleOptions) => {
  const { baseUrls, retryPolicy } = options || {};
  return [FetchModule.forFeature({ baseUrls, retryPolicy })];
};

@Module({})
export class ConsensusModule {
  static forRoot(options?: ConsensusModuleOptions): DynamicModule {
    return {
      global: true,
      module: ConsensusModule,
      imports: getConsensusModuleImports(options),
      providers: [ConsensusService],
      exports: [ConsensusService],
    };
  }

  static forFeature(options?: ConsensusModuleOptions): DynamicModule {
    return {
      module: ConsensusModule,
      imports: getConsensusModuleImports(options),
      providers: [ConsensusService],
      exports: [ConsensusService],
    };
  }
}
