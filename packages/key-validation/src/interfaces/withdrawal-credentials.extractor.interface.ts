import { createInterface } from '@lido-nestjs/di';
import { PossibleWC, WithdrawalCredentialsHex } from './common';
import { CHAINS } from '@lido-nestjs/constants';

export const WithdrawalCredentialsExtractorInterface =
  createInterface<WithdrawalCredentialsExtractorInterface>(
    'WithdrawalCredentialsExtractorInterface',
  );

export interface WithdrawalCredentialsExtractorInterface {
  /**
   * Returns current WC for a specific module, or common WC from the Lido
   * contract
   */
  getWithdrawalCredentials(
    moduleId?: number,
  ): Promise<WithdrawalCredentialsHex>;

  /**
   * Returns all possible (current and historic) WC for a specific module, or
   * common WC from the Lido contract.
   */
  getPossibleWithdrawalCredentials(moduleId?: number): Promise<PossibleWC>;

  /**
   * Returns module type (bytes32)
   */
  getModuleType(moduleId: number): Promise<string>;

  /**
   * Returns current chain id
   */
  getChainId(): Promise<CHAINS>;
}
