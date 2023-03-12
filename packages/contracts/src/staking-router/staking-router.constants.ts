import { CHAINS } from '@lido-nestjs/constants';

export const STAKING_ROUTER_CONTRACT_TOKEN = Symbol('stakingRouterContract');

export const STAKING_ROUTER_CONTRACT_ADDRESSES = {
  [CHAINS.Goerli]: '0x2fa2Cdd94C11B0e8B50205E1F304e97D9797ae09',
  [CHAINS.Zhejiang]: '0x0Ed4aCd69f6e00a2Ca0d141f8A900aC6BFaF70F0',
};
