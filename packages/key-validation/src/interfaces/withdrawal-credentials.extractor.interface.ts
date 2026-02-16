import { createInterface } from '@lido-nestjs/di';
import { PossibleWC, WithdrawalCredentialsHex } from './common';
import { CHAINS } from '@lido-nestjs/constants';

export const WithdrawalCredentialsExtractorInterface =
  createInterface<WithdrawalCredentialsExtractorInterface>(
    'WithdrawalCredentialsExtractorInterface',
  );

export interface WithdrawalCredentialsExtractorInterface {
  /**
   * Returns all possible (current and historic) WC for a specific module
   */
  getPossibleWithdrawalCredentials(moduleId: number): Promise<PossibleWC>;

  /**
   * Returns current WC for a specific module from StakingRouter
   */
  getWithdrawalCredentials(moduleId: number): Promise<WithdrawalCredentialsHex>;

  /**
   * Returns module type (bytes32) by calling IStakingModule.getType() on the module address
   */
  getModuleType(moduleId: number): Promise<string>;

  /**
   * Returns current chain id
   */
  getChainId(): Promise<CHAINS>;
}
