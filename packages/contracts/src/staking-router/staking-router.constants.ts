import { CHAINS } from '@lido-nestjs/constants';

export const STAKING_ROUTER_CONTRACT_TOKEN = Symbol('stakingRouterContract');

export const STAKING_ROUTER_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xFdDf38947aFB03C621C71b06C9C70bce73f12999',
  [CHAINS.Goerli]: '0xa3Dbd317E53D363176359E10948BA0b1c0A4c820',
  [CHAINS.Zhejiang]: '0x0Ed4aCd69f6e00a2Ca0d141f8A900aC6BFaF70F0',
};
