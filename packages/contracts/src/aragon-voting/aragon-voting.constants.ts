import { CHAINS } from '@lido-nestjs/constants';

export const ARAGON_VOTING_CONTRACT_TOKEN = Symbol('aragonVotingContract');

export const ARAGON_VOTING_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x2e59A20f205bB85a89C53f1936454680651E618e',
  [CHAINS.Goerli]: '0xbc0b67b4553f4cf52a913de9a6ed0057e2e758db',
  [CHAINS.Holesky]: '0xdA7d2573Df555002503F29aA4003e398d28cc00f',
  [CHAINS.Sepolia]: '0x39A0EbdEE54cB319f4F42141daaBDb6ba25D341A',
  [CHAINS.Hoodi]: '0x49B3512c44891bef83F8967d075121Bd1b07a01B',
};
