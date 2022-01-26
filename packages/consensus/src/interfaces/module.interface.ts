import { FetchModuleOptions } from '@lido-nestjs/fetch';
export interface ConsensusModuleOptions extends FetchModuleOptions {
  poolInterval?: number;
}
