import { CHAINS } from '@lido-nestjs/constants';

export const WITHDRAWAL_QUEUE_CONTRACT_TOKEN = Symbol(
  'withdrawalQueueContract',
);

export const WITHDRAWAL_QUEUE_CONTRACT_ADDRESSES = {
  [CHAINS.Goerli]: '0xCF117961421cA9e546cD7f50bC73abCdB3039533',
  [CHAINS.Zhejiang]: '0x4c1F6cA213abdbc19b27f2562d7b1A645A019bD9',
};
