import { Module } from '@nestjs/common';
import {
  WITHDRAWAL_QUEUE_CONTRACT_TOKEN,
  WITHDRAWAL_QUEUE_CONTRACT_ADDRESSES,
} from './withdrawal-queue.constants';
import { WithdrawalQueue__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class WithdrawalQueueContractModule extends ContractModule {
  static module = WithdrawalQueueContractModule;
  static contractFactory = WithdrawalQueue__factory;
  static contractToken = WITHDRAWAL_QUEUE_CONTRACT_TOKEN;
  static defaultAddresses = WITHDRAWAL_QUEUE_CONTRACT_ADDRESSES;
}
