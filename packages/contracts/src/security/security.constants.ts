import { CHAINS } from '@lido-nestjs/constants';

export const SECURITY_CONTRACT_TOKEN = Symbol('securityContract');

export const SECURITY_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xDb149235B6F40dC08810AA69869783Be101790e7',
  [CHAINS.Goerli]: '0xe57025E250275cA56f92d76660DEcfc490C7E79A',
  [CHAINS.Zhejiang]: '0xaaB7034eB0C0556c61c4E2F5B9884abf9EE357c9',
};
