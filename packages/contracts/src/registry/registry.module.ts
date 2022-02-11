import { Module } from '@nestjs/common';
import {
  REGISTRY_CONTRACT_TOKEN,
  REGISTRY_CONTRACT_ADDRESSES,
} from './registry.constants';
import { Registry__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class RegistryContractModule extends ContractModule {
  static module = RegistryContractModule;
  static contractFactory = Registry__factory;
  static contractToken = REGISTRY_CONTRACT_TOKEN;
  static defaultAddresses = REGISTRY_CONTRACT_ADDRESSES;
}
