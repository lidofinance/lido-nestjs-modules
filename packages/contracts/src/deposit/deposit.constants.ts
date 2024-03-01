import { CHAINS } from '@lido-nestjs/constants';

export const DEPOSIT_CONTRACT_TOKEN = Symbol('depositContract');

export const DEPOSIT_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x00000000219ab540356cbb839cbe05303d7705fa',
  [CHAINS.Goerli]: '0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b',
  [CHAINS.Holesky]: '0x4242424242424242424242424242424242424242',
  [CHAINS.Sepolia]: '0x80b5DC88C98E528bF9cb4B7F0f076aC41da24651',
};
