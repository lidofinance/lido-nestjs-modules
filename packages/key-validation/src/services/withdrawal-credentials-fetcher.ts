import {
  PossibleWC,
  WithdrawalCredentialsExtractorInterface,
  WithdrawalCredentialsHex,
} from '../interfaces';
import 'reflect-metadata';
import { Inject, Injectable } from '@nestjs/common';
import { ImplementsAtRuntime } from '@lido-nestjs/di';
import { CHAINS } from '@lido-nestjs/constants';
import {
  StakingRouter,
  STAKING_ROUTER_CONTRACT_TOKEN,
  IStakingModule__factory,
} from '@lido-nestjs/contracts';
import { WITHDRAWAL_CREDENTIALS } from '../constants/constants';
import { bufferFromHexString } from '../common/buffer-hex';
import { MemoizeInFlightPromise } from '@lido-nestjs/utils';

// bytes32 representation of "curated-onchain-v1"
// = formatBytes32String('curated-onchain-v1')
const CURATED_ONCHAIN_V1_TYPE =
  '0x637572617465642d6f6e636861696e2d76310000000000000000000000000000';

@Injectable()
@ImplementsAtRuntime(WithdrawalCredentialsExtractorInterface)
export class WithdrawalCredentialsFetcher
  implements WithdrawalCredentialsExtractorInterface
{
  public constructor(
    @Inject(STAKING_ROUTER_CONTRACT_TOKEN)
    private readonly stakingRouter: StakingRouter,
  ) {}

  @MemoizeInFlightPromise()
  public async getWithdrawalCredentials(
    moduleId: number,
  ): Promise<WithdrawalCredentialsHex> {
    return this.stakingRouter.getStakingModuleWithdrawalCredentials(moduleId);
  }

  /**
   * Gets the module type by:
   * 1. Getting module address from StakingRouter
   * 2. Connecting to it via IStakingModule interface
   * 3. Calling getType() which returns bytes32
   */
  @MemoizeInFlightPromise()
  public async getModuleType(moduleId: number): Promise<string> {
    const module = await this.stakingRouter.getStakingModule(moduleId);
    const stakingModule = IStakingModule__factory.connect(
      module.stakingModuleAddress,
      this.stakingRouter.provider,
    );
    return stakingModule.getType();
  }

  @MemoizeInFlightPromise()
  public async getPossibleWithdrawalCredentials(
    moduleId: number,
  ): Promise<PossibleWC> {
    const currentWC = await this.getWithdrawalCredentials(moduleId);
    const moduleType = await this.getModuleType(moduleId);

    // Only curated-onchain-v1 modules could have historical WC
    const isCurated = moduleType === CURATED_ONCHAIN_V1_TYPE;
    const previousWC = isCurated
      ? await this.getPreviousWithdrawalCredentials()
      : [];

    return {
      currentWC: [currentWC, bufferFromHexString(currentWC)],
      previousWC,
    };
  }

  @MemoizeInFlightPromise()
  protected async getPreviousWithdrawalCredentials(): Promise<
    PossibleWC['previousWC']
  > {
    const chainId = await this.getChainId();
    const oldWC = WITHDRAWAL_CREDENTIALS[chainId] ?? [];
    return oldWC.map((wc) => [wc, bufferFromHexString(wc)]);
  }

  @MemoizeInFlightPromise()
  public async getChainId(): Promise<CHAINS> {
    const network = await this.stakingRouter.provider.getNetwork();
    return network.chainId;
  }
}
