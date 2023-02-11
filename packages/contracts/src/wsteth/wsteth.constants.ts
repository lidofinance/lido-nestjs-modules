import { CHAINS } from '@lido-nestjs/constants';

export const WSTETH_CONTRACT_TOKEN = Symbol('wstethContract');

export const WSTETH_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  [CHAINS.Goerli]: '0x6320cd32aa674d2898a68ec82e869385fc5f7e2f',
  [CHAINS.Zhejiang]: '0xBd63CAf9D3CCb356Df1332604C54AA73e5cf6aB3',
};
