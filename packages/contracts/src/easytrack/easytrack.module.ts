import { Module } from '@nestjs/common';
import {
  EASYTRACK_CONTRACT_TOKEN,
  EASYTRACK_CONTRACT_ADDRESSES,
} from './easytrack.constants';
import { Easytrack__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class EasyTrackContractModule extends ContractModule {
  static module = EasyTrackContractModule;
  static contractFactory = Easytrack__factory;
  static contractToken = EASYTRACK_CONTRACT_TOKEN;
  static defaultAddresses = EASYTRACK_CONTRACT_ADDRESSES;
}
