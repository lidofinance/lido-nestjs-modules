import { Module } from '@nestjs/common';
import {
  ACCOUNTING_ORACLE_HASH_CONSENSUS_TOKEN,
  ACCOUNTING_ORACLE_HASH_CONSENSUS_ADDRESSES,
} from './accounting-oracle-hash-consensus.constants';
import { HashConsensus__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class AccountingOracleHashConsensusModule extends ContractModule {
  static module = AccountingOracleHashConsensusModule;
  static contractFactory = HashConsensus__factory;
  static contractToken = ACCOUNTING_ORACLE_HASH_CONSENSUS_TOKEN;
  static defaultAddresses = ACCOUNTING_ORACLE_HASH_CONSENSUS_ADDRESSES;
}
