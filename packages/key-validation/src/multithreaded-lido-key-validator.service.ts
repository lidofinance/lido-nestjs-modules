import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { CHAINS } from '@lido-nestjs/constants/src';
import { LidoKey, PossibleWC, Pubkey } from './interfaces/common';
import Piscina from 'piscina';
import { partition } from './common/partition';
import worker from './worker/lido-key-validator.worker';
import { WithdrawalCredentialsExtractorInterface } from './interfaces';

@Injectable()
export class MultithreadedLidoKeyValidator {

  public constructor(
    private readonly wcExtractor: WithdrawalCredentialsExtractorInterface,
  ) {}

  public async validateKey(
    lidoKey: LidoKey,
    chainId: CHAINS,
  ): Promise<[Pubkey, boolean]> {
    const possibleWC = await this.wcExtractor.getPossibleWithdrawalCredentials();

    return worker({ lidoKeys: [lidoKey], chainId, possibleWC })[0];
  }

  public async validateKeys(
    lidoKeys: LidoKey[],
    chainId: CHAINS,
  ): Promise<[Pubkey, boolean][]> {
    if (lidoKeys.length === 0) {
      return [];
    }

    return this.validateKeysMultiThreaded(lidoKeys, chainId);
  }

  protected async validateKeysMultiThreaded(
    lidoKeys: LidoKey[],
    chainId: CHAINS,
  ): Promise<[Pubkey, boolean][]> {
    const possibleWC = await this.wcExtractor.getPossibleWithdrawalCredentials();

    /* istanbul ignore next */
    const filename = process.env.TS_JEST
      ? path.resolve(__dirname, '../dist/worker/lido-key-validator.worker.js')
      : path.resolve(__dirname, './worker/lido-key-validator.worker.js');

    const threadPool = new Piscina({
      filename: filename,
    });

    const partitions = partition(lidoKeys, threadPool.threads.length, 100);

    const result = await Promise.all(
      partitions.map((lidoKeysPart) =>
        threadPool.run({ possibleWC, lidoKeys: lidoKeysPart, chainId }),
      ),
    );

    await threadPool.destroy();

    return result.flat();
  }
}
