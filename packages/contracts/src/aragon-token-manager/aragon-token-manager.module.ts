import { Module } from '@nestjs/common';
import {
  ARAGON_TOKEN_MANAGER_CONTRACT_TOKEN,
  ARAGON_TOKEN_MANAGER_CONTRACT_ADDRESSES,
} from './aragon-token-manager.constants';
import { AragonTokenManager__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class AragonTokenManagerContractModule extends ContractModule {
  static module = AragonTokenManagerContractModule;
  static contractFactory = AragonTokenManager__factory;
  static contractToken = ARAGON_TOKEN_MANAGER_CONTRACT_TOKEN;
  static defaultAddresses = ARAGON_TOKEN_MANAGER_CONTRACT_ADDRESSES;
}
