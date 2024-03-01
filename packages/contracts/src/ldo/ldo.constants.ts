import { CHAINS } from '@lido-nestjs/constants';

export const LDO_CONTRACT_TOKEN = Symbol('ldoContract');

export const LDO_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
  [CHAINS.Goerli]: '0x56340274fB5a72af1A3C6609061c451De7961Bd4',
  [CHAINS.Holesky]: '0x14ae7daeecdf57034f3E9db8564e46Dba8D97344',
};
