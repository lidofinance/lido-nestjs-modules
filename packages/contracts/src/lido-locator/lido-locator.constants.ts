import { CHAINS } from '@lido-nestjs/constants';

export const LIDO_LOCATOR_CONTRACT_TOKEN = Symbol('lidoLocatorContract');

export const LIDO_LOCATOR_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xC1d0b3DE6792Bf6b4b37EccdcC24e45978Cfd2Eb',
  [CHAINS.Goerli]: '0x1eDf09b5023DC86737b59dE68a8130De878984f5',
  [CHAINS.Holesky]: '0x28FAB2059C713A7F9D8c86Db49f9bb0e96Af1ef8',
  [CHAINS.Sepolia]: '0x8f6254332f69557A72b0DA2D5F0Bc07d4CA991E7',
};
