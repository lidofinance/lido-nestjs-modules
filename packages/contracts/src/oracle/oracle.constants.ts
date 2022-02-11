import { CHAINS } from '@lido-nestjs/constants';

export const ORACLE_CONTRACT_TOKEN = Symbol('oracleContract');

export const ORACLE_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x442af784A788A5bd6F42A01Ebe9F287a871243fb',
  [CHAINS.Goerli]: '0x24d8451BC07e7aF4Ba94F69aCDD9ad3c6579D9FB',
};
