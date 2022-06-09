import { Module } from '@nestjs/common';
import {
  EXECUTION_REWARDS_VAULT_CONTRACT_TOKEN,
  EXECUTION_REWARDS_VAULT_CONTRACT_ADDRESSES,
} from './execution-rewards-vault.constants';
import { ExecutionRewardsVault__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class ExecutionRewardsVaultContractModule extends ContractModule {
  static module = ExecutionRewardsVaultContractModule;
  static contractFactory = ExecutionRewardsVault__factory;
  static contractToken = EXECUTION_REWARDS_VAULT_CONTRACT_TOKEN;
  static defaultAddresses = EXECUTION_REWARDS_VAULT_CONTRACT_ADDRESSES;
}
