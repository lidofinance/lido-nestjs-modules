import { CHAINS } from '@lido-nestjs/constants';

export const ACCOUNTING_ORACLE_HASH_CONSENSUS_TOKEN = Symbol(
  'accountingOracleHashConsensus',
);

export const ACCOUNTING_ORACLE_HASH_CONSENSUS_ADDRESSES = {
  [CHAINS.Mainnet]: '0xD624B08C83bAECF0807Dd2c6880C3154a5F0B288',
  [CHAINS.Goerli]: '0x8d87A8BCF8d4e542fd396D1c50223301c164417b',
};
