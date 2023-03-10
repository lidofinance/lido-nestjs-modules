import { CHAINS } from '@lido-nestjs/constants';

export const WSTETH_CONTRACT_TOKEN = Symbol('wstethContract');

export const WSTETH_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  [CHAINS.Goerli]: '0x6320cd32aa674d2898a68ec82e869385fc5f7e2f',
  [CHAINS.Zhejiang]: '0x9E4e17458c8A7C51939ec0d4e3aA736Ce423FD12',
};
