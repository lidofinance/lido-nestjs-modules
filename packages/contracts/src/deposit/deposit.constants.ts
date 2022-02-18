import { CHAINS } from '@lido-nestjs/constants';

export const DEPOSIT_CONTRACT_TOKEN = Symbol('depositContract');

export const DEPOSIT_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x00000000219ab540356cbb839cbe05303d7705fa',
  [CHAINS.Goerli]: '0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b',
};