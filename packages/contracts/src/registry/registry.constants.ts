import { CHAINS } from '@lido-nestjs/constants';

export const REGISTRY_CONTRACT_TOKEN = Symbol('registryContract');

export const REGISTRY_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x55032650b14df07b85bF18A3a3eC8E0Af2e028d5',
  [CHAINS.Goerli]: '0x9D4AF1Ee19Dad8857db3a45B0374c81c8A1C6320',
};
