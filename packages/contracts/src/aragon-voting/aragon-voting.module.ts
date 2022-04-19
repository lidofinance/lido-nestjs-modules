import { Module } from '@nestjs/common';
import {
  ARAGON_VOTING_CONTRACT_TOKEN,
  ARAGON_VOTING_CONTRACT_ADDRESSES,
} from './aragon-voting.constants';
import { AragonVoting__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class AragonVotingManagerContractModule extends ContractModule {
  static module = AragonVotingManagerContractModule;
  static contractFactory = AragonVoting__factory;
  static contractToken = ARAGON_VOTING_CONTRACT_TOKEN;
  static defaultAddresses = ARAGON_VOTING_CONTRACT_ADDRESSES;
}
