import { Module } from '@nestjs/common';
import {
  STAKING_ROUTER_CONTRACT_TOKEN,
  STAKING_ROUTER_CONTRACT_ADDRESSES,
} from './staking-router.constants';
import { StakingRouter__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class StakingRouterContractModule extends ContractModule {
  static module = StakingRouterContractModule;
  static contractFactory = StakingRouter__factory;
  static contractToken = STAKING_ROUTER_CONTRACT_TOKEN;
  static defaultAddresses = STAKING_ROUTER_CONTRACT_ADDRESSES;
}
