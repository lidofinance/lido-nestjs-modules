import { Module } from '@nestjs/common';
import {
  DEPOSIT_CONTRACT_TOKEN,
  DEPOSIT_CONTRACT_ADDRESSES,
} from './deposit.constants';
import { Deposit__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class DepositContractModule extends ContractModule {
  static module = DepositContractModule;
  static contractFactory = Deposit__factory;
  static contractToken = DEPOSIT_CONTRACT_TOKEN;
  static defaultAddresses = DEPOSIT_CONTRACT_ADDRESSES;
}
