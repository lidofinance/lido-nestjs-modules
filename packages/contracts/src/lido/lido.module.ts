import { Module } from '@nestjs/common';
import { LIDO_CONTRACT_TOKEN, LIDO_CONTRACT_ADDRESSES } from './lido.constants';
import { Lido__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class LidoContractModule extends ContractModule {
  static module = LidoContractModule;
  static contractFactory = () => Lido__factory;
  static contractToken = LIDO_CONTRACT_TOKEN;
  static defaultAddresses = LIDO_CONTRACT_ADDRESSES;
}
