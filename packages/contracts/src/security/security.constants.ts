import { CHAINS } from '@lido-nestjs/constants';

export const SECURITY_CONTRACT_TOKEN = Symbol('securityContract');

export const SECURITY_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xC77F8768774E1c9244BEed705C4354f2113CFc09',
  [CHAINS.Goerli]: '0xe57025E250275cA56f92d76660DEcfc490C7E79A',
  [CHAINS.Holesky]: '0x045dd46212A178428c088573A7d102B9d89a022A',
};
