import { CHAINS } from '@lido-nestjs/constants';

export const ZERO_HASH = Buffer.alloc(32, 0);
export const EMPTY_SIGNATURE = Buffer.alloc(96, 0);
export const DOMAIN_DEPOSIT = Buffer.from('03000000', 'hex');

export const GENESIS_FORK_VERSION: { [index: number]: Buffer | undefined } = {
  [CHAINS.Mainnet]: Buffer.from('00000000', 'hex'),
  [CHAINS.Goerli]: Buffer.from('00001020', 'hex'),
  [CHAINS.Holesky]: Buffer.from('01017000', 'hex'),
};

export const WITHDRAWAL_CREDENTIALS: { [index: number]: string[] | undefined } =
  {
    [CHAINS.Mainnet]: [
      '0x009690e5d4472c7c0dbdf490425d89862535d2a52fb686333f3a0a9ff5d2125e',
    ],
    [CHAINS.Goerli]: [
      '0x00040517ce98f81070cea20e35610a3ae23a45f0883b0b035afc5717cc2e833e',
    ],
    [CHAINS.Holesky]: [],
  };
