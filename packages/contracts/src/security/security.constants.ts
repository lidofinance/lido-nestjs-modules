import { CHAINS } from '@lido-nestjs/constants';

export const SECURITY_CONTRACT_TOKEN = Symbol('securityContract');

export const SECURITY_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xC77F8768774E1c9244BEed705C4354f2113CFc09',
  [CHAINS.Goerli]: '0xe57025E250275cA56f92d76660DEcfc490C7E79A',
  [CHAINS.Zhejiang]: '0x57d31c50dB78e4d95C49Ab83EC011B4D0b0acF59',
};
