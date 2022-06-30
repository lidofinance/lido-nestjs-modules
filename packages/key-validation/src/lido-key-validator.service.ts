import { Inject, Injectable } from '@nestjs/common';
import {
  LidoKeyValidatorInterface,
  Key,
  Pubkey,
} from './interfaces/lido-key-validator.interface';
import { Lido, LIDO_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { bufferFromHexString } from './common/buffer-hex';
import { WITHDRAWAL_CREDENTIALS } from './constants/constants';
import { validateLidoKeyForPossibleWc } from './common/validate';
import { CHAINS } from '@lido-nestjs/constants/src';
import { PossibleWC } from './interfaces/common';

@Injectable()
export class LidoKeyValidator implements LidoKeyValidatorInterface {
  private possibleWithdrawalCredentialsCache: {
    [chainId: number]: Promise<PossibleWC> | undefined;
  } = {};

  public constructor(
    @Inject(LIDO_CONTRACT_TOKEN) private readonly lidoContract: Lido,
  ) {}

  public async validateKey(
    key: Key,
    chainId: CHAINS,
  ): Promise<[Pubkey, boolean]> {
    const possibleWC = await this.getPossibleWithdrawalCredentialsCached(
      chainId,
    );

    return validateLidoKeyForPossibleWc(possibleWC, key, chainId);
  }

  public async validateKeys(
    keys: Key[],
    chainId: CHAINS,
  ): Promise<[Pubkey, boolean][]> {
    if (keys.length === 0) {
      return [];
    }

    return this.validateKeysSingleThreaded(keys, chainId);
  }

  protected async validateKeysSingleThreaded(
    keys: Key[],
    chainId: CHAINS,
  ): Promise<[Pubkey, boolean][]> {
    const possibleWC = await this.getPossibleWithdrawalCredentialsCached(
      chainId,
    );

    return keys.map((key) =>
      validateLidoKeyForPossibleWc(possibleWC, key, chainId),
    );
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
