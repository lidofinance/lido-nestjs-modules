import { Module } from '@nestjs/common';
import {
  HASH_CONSENSUS_TOKEN,
  HASH_CONSENSUS_ADDRESSES,
} from './hash-consensus.constants';
import { HashConsensus__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class HashConsensusModule extends ContractModule {
  static module = HashConsensusModule;
  static contractFactory = HashConsensus__factory;
  static contractToken = HASH_CONSENSUS_TOKEN;
  static defaultAddresses = HASH_CONSENSUS_ADDRESSES;
}
