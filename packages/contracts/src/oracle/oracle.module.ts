import { Module } from '@nestjs/common';
import {
  ORACLE_CONTRACT_TOKEN,
  ORACLE_CONTRACT_ADDRESSES,
} from './oracle.constants';
import { Oracle__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class OracleContractModule extends ContractModule {
  static module = OracleContractModule;
  static contractFactory = Oracle__factory;
  static contractToken = ORACLE_CONTRACT_TOKEN;
  static defaultAddresses = ORACLE_CONTRACT_ADDRESSES;
}
