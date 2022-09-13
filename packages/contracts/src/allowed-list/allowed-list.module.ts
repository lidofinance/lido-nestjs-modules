import { Module } from '@nestjs/common';
import {
  ALLOWED_LIST_CONTRACT_TOKEN,
  ALLOWED_LIST_CONTRACT_ADDRESSES,
} from './allowed-list.constants';
import { AllowedList__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class AllowedListContractModule extends ContractModule {
  static module = AllowedListContractModule;
  static contractFactory = AllowedList__factory;
  static contractToken = ALLOWED_LIST_CONTRACT_TOKEN;
  static defaultAddresses = ALLOWED_LIST_CONTRACT_ADDRESSES;
}
