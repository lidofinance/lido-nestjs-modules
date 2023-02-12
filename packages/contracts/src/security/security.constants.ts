import { CHAINS } from '@lido-nestjs/constants';

export const SECURITY_CONTRACT_TOKEN = Symbol('securityContract');

export const SECURITY_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0xDb149235B6F40dC08810AA69869783Be101790e7',
  [CHAINS.Goerli]: '0xed23ad3ea5fb9d10e7371caef1b141ad1c23a80c',
  [CHAINS.Zhejiang]: '0x48bEdD13FF63F7Cd4d349233B6a57Bff285f8E32',
};
