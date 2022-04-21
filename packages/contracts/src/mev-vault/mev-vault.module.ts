import { Module } from '@nestjs/common';
import {
  MEV_VAULT_CONTRACT_TOKEN,
  MEV_VAULT_CONTRACT_ADDRESSES,
} from './mev-vault.constants';
import { MevVault__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class MevVaultContractModule extends ContractModule {
  static module = MevVaultContractModule;
  static contractFactory = MevVault__factory;
  static contractToken = MEV_VAULT_CONTRACT_TOKEN;
  static defaultAddresses = MEV_VAULT_CONTRACT_ADDRESSES;
}
