import { Module } from '@nestjs/common';
import {
  SECURITY_CONTRACT_TOKEN,
  SECURITY_CONTRACT_ADDRESSES,
} from './security.constants';
import { Security__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class SecurityContractModule extends ContractModule {
  static module = SecurityContractModule;
  static contractFactory = Security__factory;
  static contractToken = SECURITY_CONTRACT_TOKEN;
  static defaultAddresses = SECURITY_CONTRACT_ADDRESSES;
}
