import { CHAINS } from '@lido-nestjs/constants';

export const LIDO_CONTRACT_TOKEN = Symbol('lidoContract');

export const LIDO_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  [CHAINS.Goerli]: '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F',
};
