import { CHAINS } from '@lido-nestjs/constants';

export const ALLOWED_LIST_CONTRACT_TOKEN = Symbol('allowedListContract');

// TODO: add mainnet and holesky addresses
export const ALLOWED_LIST_CONTRACT_ADDRESSES = {
  // [CHAINS.Mainnet]: 'TODO',
  [CHAINS.Goerli]: '0xeabe95ac5f3d64ae16acbb668ed0efcd81b721bc',
  // [CHAINS.Holesky]: 'TODO',
};
