import * as path from 'path';
import { Inject, Injectable } from '@nestjs/common';
import { LidoKeyValidatorInterface } from './interfaces/lido-key-validator.interface';
import { Lido, LIDO_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { bufferFromHexString } from './common/buffer-hex';
import { WITHDRAWAL_CREDENTIALS } from './constants/constants';
import { CHAINS } from '@lido-nestjs/constants/src';
import { LidoKey, PossibleWC, Pubkey } from './interfaces/common';
import Piscina from 'piscina';
import { partition } from './common/partition';
import worker from './worker/lido-key-validator.worker';
import * as os from 'os';
import { ImplementsAtRuntime } from '@lido-nestjs/di';

@Injectable()
@ImplementsAtRuntime(LidoKeyValidatorInterface)
export class MultithreadedLidoKeyValidator
  implements LidoKeyValidatorInterface
{
  private possibleWithdrawalCredentialsCache: {
    [chainId: number]: Promise<PossibleWC> | undefined;
  } = {};

  public constructor(
    @Inject(LIDO_CONTRACT_TOKEN) private readonly lidoContract: Lido,
  ) {}

  public async validateKey(
    lidoKey: LidoKey,
    chainId: CHAINS,
  ): Promise<[Pubkey, boolean]> {
    const possibleWC = await this.getPossibleWithdrawalCredentialsCached(
      chainId,
    );

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
    const possibleWC = await this.getPossibleWithdrawalCredentialsCached(
      chainId,
    );

    const partitions = partition(lidoKeys, os.cpus().length, 100);

    /* istanbul ignore next */
    const filename = process.env.TS_JEST
      ? path.resolve(__dirname, '../dist/worker/lido-key-validator.worker.js')
      : path.resolve(__dirname, './worker/lido-key-validator.worker.js');

    const threadPool = new Piscina({
      filename: filename,
    });

    const result = await Promise.all(
      partitions.map((lidoKeysPart) =>
        threadPool.run({ possibleWC, lidoKeys: lidoKeysPart, chainId }),
      ),
    );

    await threadPool.destroy();

    return result.reduce((acc, x) => [...acc, ...x], []);
  }

  protected async getPossibleWithdrawalCredentialsCached(
    chainId: CHAINS,
  ): Promise<PossibleWC> {
    const promise = this.possibleWithdrawalCredentialsCache[chainId];
    if (promise) {
      return await promise;
    }

    return (this.possibleWithdrawalCredentialsCache[chainId] =
      this.getPossibleWithdrawalCredentials(chainId));
  }

  protected async getPossibleWithdrawalCredentials(
    chainId: CHAINS,
  ): Promise<PossibleWC> {
    const currentWC: string =
      await this.lidoContract.getWithdrawalCredentials();
    const oldWC = WITHDRAWAL_CREDENTIALS[chainId] ?? [];

    const oldWcBuffered: [string, Buffer][] = oldWC.map((wc) => [
      wc,
      bufferFromHexString(wc),
    ]);

    return {
      currentWC: [currentWC, bufferFromHexString(currentWC)],
      previousWC: oldWcBuffered,
    };
  }
}
