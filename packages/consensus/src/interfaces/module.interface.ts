/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';

export interface ConsensusModuleOptions {
  poolInterval?: number;
}

export interface ConsensusModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    ConsensusModuleOptions {}

export interface ConsensusModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ConsensusModuleOptions>;
  inject?: any[];
}
