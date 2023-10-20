import { CHAINS } from '@lido-nestjs/constants';

export const ALLOWED_LIST_CONTRACT_TOKEN = Symbol('allowedListContract');

export const ALLOWED_LIST_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xF95f069F9AD107938F6ba802a3da87892298610E',
  [CHAINS.Goerli]: '0xeabe95ac5f3d64ae16acbb668ed0efcd81b721bc',
  [CHAINS.Holesky]: '0x2d86C5855581194a386941806E38cA119E50aEA3',
};
