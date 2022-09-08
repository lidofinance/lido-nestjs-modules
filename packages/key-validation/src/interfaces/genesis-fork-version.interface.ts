import { CHAINS } from '@lido-nestjs/constants';
import { createInterface } from '@lido-nestjs/di';

export const GenesisForkVersionServiceInterface =
  createInterface<GenesisForkVersionServiceInterface>(
    'GenesisForkVersionServiceInterface',
  );

export interface GenesisForkVersionServiceInterface {
  getGenesisForkVersion(chainId: CHAINS): Promise<Buffer>;
}
