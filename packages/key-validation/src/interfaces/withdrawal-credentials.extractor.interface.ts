import { createInterface } from '@lido-nestjs/di';
import { PossibleWC } from './common';
import { CHAINS } from '@lido-nestjs/constants';


export const WithdrawalCredentialsExtractorInterface =
  createInterface<WithdrawalCredentialsExtractorInterface>('WithdrawalCredentialsExtractorInterface');

export interface WithdrawalCredentialsExtractorInterface {
  /**
   * Returns all possible (current and previous) WC for current chain
   */
  getPossibleWithdrawalCredentials(): Promise<PossibleWC>;

  /**
   * Returns all current WC for current chain id
   */
  getWithdrawalCredentials(): Promise<string>;

  /**
   * Returns current chain id
   */
  getChainId(): Promise<CHAINS>
}
