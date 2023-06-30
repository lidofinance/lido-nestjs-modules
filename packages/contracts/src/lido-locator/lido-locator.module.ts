import { Module } from '@nestjs/common';
import {
  LIDO_LOCATOR_CONTRACT_TOKEN,
  LIDO_LOCATOR_CONTRACT_ADDRESSES,
} from './lido-locator.constants';
import { LidoLocator__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class LidoLocatorContractModule extends ContractModule {
  static module = LidoLocatorContractModule;
  static contractFactory = () => LidoLocator__factory;
  static contractToken = LIDO_LOCATOR_CONTRACT_TOKEN;
  static defaultAddresses = LIDO_LOCATOR_CONTRACT_ADDRESSES;
}
