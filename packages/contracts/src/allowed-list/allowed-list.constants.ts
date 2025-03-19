import { CHAINS } from '@lido-nestjs/constants';

export const ALLOWED_LIST_CONTRACT_TOKEN = Symbol('allowedListContract');

export const ALLOWED_LIST_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xf95f069f9ad107938f6ba802a3da87892298610e',
  [CHAINS.Holesky]: '0x2d86c5855581194a386941806e38ca119e50aea3',
  [CHAINS.Goerli]: '0xeabe95ac5f3d64ae16acbb668ed0efcd81b721bc',
  [CHAINS.Hoodi]: '0x279d3A456212a1294DaEd0faEE98675a52E8A4Bf',
};
