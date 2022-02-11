import { Module } from '@nestjs/common';
import { LDO_CONTRACT_TOKEN, LDO_CONTRACT_ADDRESSES } from './ldo.constants';
import { Ldo__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class LdoContractModule extends ContractModule {
  static module = LdoContractModule;
  static contractFactory = Ldo__factory;
  static contractToken = LDO_CONTRACT_TOKEN;
  static defaultAddresses = LDO_CONTRACT_ADDRESSES;
}
