import { CHAINS } from '@lido-nestjs/constants';

export const ZERO_HASH = Buffer.alloc(32, 0);
export const EMPTY_SIGNATURE = Buffer.alloc(96, 0);
export const DOMAIN_DEPOSIT = Buffer.from('03000000', 'hex');

export const GENESIS_FORK_VERSION: { [index: number]: Buffer | undefined } = {
  [CHAINS.Mainnet]: Buffer.from('00000000', 'hex'),
  [CHAINS.Goerli]: Buffer.from('00001020', 'hex'),
  [CHAINS.Ropsten]: Buffer.from('00000000', 'hex'),
  [CHAINS.Rinkeby]: Buffer.from('00000000', 'hex'),
  [CHAINS.Kintsugi]: Buffer.from('60000069', 'hex'),
  [CHAINS.Kiln]: Buffer.from('70000069', 'hex'),
};

export const WITHDRAWAL_CREDENTIALS: { [index: number]: string[] | undefined } =
  {
    [CHAINS.Mainnet]: [
      '0x009690e5d4472c7c0dbdf490425d89862535d2a52fb686333f3a0a9ff5d2125e',
    ],
    [CHAINS.Goerli]: [
      '0x00040517ce98f81070cea20e35610a3ae23a45f0883b0b035afc5717cc2e833e',
    ],
    [CHAINS.Ropsten]: [
      '0x01000000000000000000000002139137fdd974181a49268d7b0ae888634e5469',
      '0x000000000000000000000000ff139137fdd974181a49268d7b0ae888634e5469',
      '0x000000000000000000000000aa139137fdd974181a49268d7b0ae888634e5469',
      '0x010000000000000000000000aa139137fdd974181a49268d7b0ae888634e5469',
      '0x73c72beecbd832c9ce342e61a772c8cfe6f1c6d661b19a98317b5dac05ce9685',
    ],
    [CHAINS.Rinkeby]: [],
    [CHAINS.Kintsugi]: [],
    [CHAINS.Kiln]: [],
  };
