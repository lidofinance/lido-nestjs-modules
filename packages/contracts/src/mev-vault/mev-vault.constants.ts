import { CHAINS } from '@lido-nestjs/constants';

export const MEV_VAULT_CONTRACT_TOKEN = Symbol('registryContract');

export const MEV_VAULT_CONTRACT_ADDRESSES = {
  [CHAINS.Goerli]: '0xece7301B3aeEC2b2B6C41a55dE831D47c205AaCC',
  [CHAINS.Kiln]: '0xe3e01f9E940dDec242C3fdD7bbb855c3770bF999',
};
