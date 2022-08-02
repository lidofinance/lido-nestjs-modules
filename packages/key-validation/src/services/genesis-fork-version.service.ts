import { CHAINS } from '@lido-nestjs/constants';
import { GenesisForkVersionServiceInterface } from '../interfaces/genesis-fork-version.interface';
import { Injectable } from '@nestjs/common';
import { ImplementsAtRuntime } from '@lido-nestjs/di';
import { GENESIS_FORK_VERSION } from '../constants/constants';

@Injectable()
@ImplementsAtRuntime(GenesisForkVersionServiceInterface)
export class GenesisForkVersionService implements GenesisForkVersionServiceInterface {
  public async getGenesisForkVersion(chainId: CHAINS): Promise<Buffer> {
    const version = GENESIS_FORK_VERSION[chainId];

    if (!version) {
      throw new Error(`GENESIS_FORK_VERSION is undefined for chain ${chainId}`);
    }

    return version;
  }
}
