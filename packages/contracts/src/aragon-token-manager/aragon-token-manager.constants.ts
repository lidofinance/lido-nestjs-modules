import { CHAINS } from '@lido-nestjs/constants';

export const ARAGON_TOKEN_MANAGER_CONTRACT_TOKEN = Symbol(
  'aragonTokenManagerContract',
);

export const ARAGON_TOKEN_MANAGER_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xf73a1260d222f447210581DDf212D915c09a3249',
  [CHAINS.Goerli]: '0xDfe76d11b365f5e0023343A367f0b311701B3bc1',
  [CHAINS.Holesky]: '0xFaa1692c6eea8eeF534e7819749aD93a1420379A',
};
