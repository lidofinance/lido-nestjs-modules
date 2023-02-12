import { CHAINS } from '@lido-nestjs/constants';

export const ARAGON_VOTING_CONTRACT_TOKEN = Symbol('aragonVotingContract');

export const ARAGON_VOTING_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x2e59A20f205bB85a89C53f1936454680651E618e',
  [CHAINS.Goerli]: '0xbc0b67b4553f4cf52a913de9a6ed0057e2e758db',
  [CHAINS.Kiln]: '0x84633bf8e3AE2508a81F09F46a47774F5aFD16B9',
  [CHAINS.Zhejiang]: '0x4Fd9911690741Ad83D8063c21BcBb89E8c4e0223',
};
