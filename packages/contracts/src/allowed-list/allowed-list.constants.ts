import { CHAINS } from '@lido-nestjs/constants';

export const ALLOWED_LIST_CONTRACT_TOKEN = Symbol('allowedListContract');

export const ALLOWED_LIST_CONTRACT_ADDRESSES = {
  [CHAINS.Goerli]: '0xeabe95ac5f3d64ae16acbb668ed0efcd81b721bc',
};
