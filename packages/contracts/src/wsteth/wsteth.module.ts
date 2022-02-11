import { Module } from '@nestjs/common';
import {
  WSTETH_CONTRACT_TOKEN,
  WSTETH_CONTRACT_ADDRESSES,
} from './wsteth.constants';
import { Wsteth__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class WstethContractModule extends ContractModule {
  static module = WstethContractModule;
  static contractFactory = Wsteth__factory;
  static contractToken = WSTETH_CONTRACT_TOKEN;
  static defaultAddresses = WSTETH_CONTRACT_ADDRESSES;
}
