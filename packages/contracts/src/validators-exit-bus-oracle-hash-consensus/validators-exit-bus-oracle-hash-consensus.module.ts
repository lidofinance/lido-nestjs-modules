import { Module } from '@nestjs/common';
import {
  VALIDATORS_EXIT_BUS_ORACLE_HASH_CONSENSUS_TOKEN,
  VALIDATORS_EXIT_BUS_ORACLE_HASH_CONSENSUS_ADDRESSES,
} from './validators-exit-bus-oracle-hash-consensus.constants';
import { HashConsensus__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class ValidatorsExitBusOracleHashConsensusModule extends ContractModule {
  static module = ValidatorsExitBusOracleHashConsensusModule;
  static contractFactory = HashConsensus__factory;
  static contractToken = VALIDATORS_EXIT_BUS_ORACLE_HASH_CONSENSUS_TOKEN;
  static defaultAddresses = VALIDATORS_EXIT_BUS_ORACLE_HASH_CONSENSUS_ADDRESSES;
}
