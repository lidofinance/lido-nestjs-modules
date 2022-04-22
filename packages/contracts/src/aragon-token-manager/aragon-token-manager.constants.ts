import { CHAINS } from '@lido-nestjs/constants';

export const ARAGON_TOKEN_MANAGER_CONTRACT_TOKEN = Symbol(
  'aragonTokenManagerContract',
);

export const ARAGON_TOKEN_MANAGER_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xf73a1260d222f447210581DDf212D915c09a3249',
  [CHAINS.Goerli]: '0xDfe76d11b365f5e0023343A367f0b311701B3bc1',
  [CHAINS.Kiln]: '0x6AB36E8B1c6Cb572F910A7e50204F41f98D5de74',
};
