import { WithdrawalCredentialsExtractorInterface } from '../interfaces/withdrawal-credentials.extractor.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ImplementsAtRuntime } from '@lido-nestjs/di';
import { CHAINS } from '@lido-nestjs/constants';
import { PossibleWC } from '../interfaces/common';
import { Lido, LIDO_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { WITHDRAWAL_CREDENTIALS } from '../constants/constants';
import { bufferFromHexString } from '../common/buffer-hex';

@Injectable()
@ImplementsAtRuntime(WithdrawalCredentialsExtractorInterface)
export class WithdrawalCredentialsFetcher implements WithdrawalCredentialsExtractorInterface {
  private possibleWcCache: Promise<PossibleWC> | undefined;

  public constructor(
    @Inject(LIDO_CONTRACT_TOKEN) private readonly lidoContract: Lido,
  ) {}

  public async getWithdrawalCredentials(): Promise<string> {
    return await this.lidoContract.getWithdrawalCredentials();
  }

  public async getPossibleWithdrawalCredentials(): Promise<PossibleWC> {
    const promise = this.possibleWcCache;
    if (promise) {
      return await promise;
    }

    return (this.possibleWcCache =
      this.getPossibleWithdrawalCredentialsWithoutCache());
  }

  protected async getPossibleWithdrawalCredentialsWithoutCache(): Promise<PossibleWC> {
    const chainId = await this.getChainId();
    const currentWC: string = await this.lidoContract.getWithdrawalCredentials();
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

  public async getChainId(): Promise<CHAINS> {
    const network = await this.lidoContract.provider.getNetwork();

    return network.chainId;
  }
}
