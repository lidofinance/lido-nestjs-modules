import { CHAINS } from '@lido-nestjs/constants';

export const WITHDRAWAL_QUEUE_CONTRACT_TOKEN = Symbol(
  'withdrawalQueueContract',
);

export const WITHDRAWAL_QUEUE_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
  [CHAINS.Goerli]: '0xCF117961421cA9e546cD7f50bC73abCdB3039533',
  [CHAINS.Holesky]: '0xc7cc160b58F8Bb0baC94b80847E2CF2800565C50',
  [CHAINS.Sepolia]: '0x1583C7b3f4C3B008720E6BcE5726336b0aB25fdd',
};
