import {
  bufferFromHexString,
  GENESIS_FORK_VERSION,
  Key,
  WITHDRAWAL_CREDENTIALS,
} from '../../src';
import { CHAINS } from '@lido-nestjs/constants';
import { range } from '@lido-nestjs/utils';
import { usedValidKeys } from './used-valid-keys';

export const genesisForkVersion: Buffer =
  GENESIS_FORK_VERSION[CHAINS.Mainnet] ?? Buffer.of(0);

export const currentWC =
  '0x010000000000000000000000b9d7934878b5fb9610b3fe8a5e441e8fad7e293f';

export const previousWC = WITHDRAWAL_CREDENTIALS[CHAINS.Mainnet]?.[0] ?? '0x0';
export const badWc = WITHDRAWAL_CREDENTIALS[CHAINS.Ropsten]?.[1] ?? '0x0';

export const validKey: Key = {
  key: '0xaa509e465d947a8c7742e1bba82f3da99ca5e49a5dfb66b7d0c964b6dde2b60e07a12340568dae0b2fded2af494808d0',
  depositSignature:
    '0xac813e4f0138f56a0d6fe7a1cc681176d79125597cb9edda33a189a5b52a0b2cd0bcf41519dd5bb307ce3f64ed37b38d11faa31a32790564721aa5d572395a058ddd12031b55e3f81b3a5992291c68a36f063f24ee51a88915198ca96c276654',
  genesisForkVersion: genesisForkVersion,
  withdrawalCredentials: bufferFromHexString(previousWC),
};

export const invalidKeyBadWC: Key = {
  key: '0xaa509e465d947a8c7742e1bba82f3da99ca5e49a5dfb66b7d0c964b6dde2b60e07a12340568dae0b2fded2af494808d0',
  depositSignature:
    '0xac813e4f0138f56a0d6fe7a1cc681176d79125597cb9edda33a189a5b52a0b2cd0bcf41519dd5bb307ce3f64ed37b38d11faa31a32790564721aa5d572395a058ddd12031b55e3f81b3a5992291c68a36f063f24ee51a88915198ca96c276654',
  genesisForkVersion: genesisForkVersion,
  withdrawalCredentials: bufferFromHexString(badWc),
};

export const invalidKeyBadGenesisForkVersion: Key = {
  key: '0xaa509e465d947a8c7742e1bba82f3da99ca5e49a5dfb66b7d0c964b6dde2b60e07a12340568dae0b2fded2af494808d0',
  depositSignature:
    '0xac813e4f0138f56a0d6fe7a1cc681176d79125597cb9edda33a189a5b52a0b2cd0bcf41519dd5bb307ce3f64ed37b38d11faa31a32790564721aa5d572395a058ddd12031b55e3f81b3a5992291c68a36f063f24ee51a88915198ca96c276654',
  genesisForkVersion: Buffer.from('70000069', 'hex'),
  withdrawalCredentials: bufferFromHexString(currentWC),
};

export const invalidUsedKeyBadSignature = {
  key: '0xaa509e465d947a8c7742e1bba82f3da99ca5e49a5dfb66b7d0c964b6dde2b60e07a12340568dae0b2fded2af494808d0',
  depositSignature:
    '0xac8134f0138f56a0d6fe7a1cc681176d79125597cb9edda33a189a5b52a0b2cd0bcf41519dd5bb307ce3f64ed37b38d11faa31a32790564721aa5d572395a058ddd12031b55e3f81b3a5992291c68a36f063f24ee51a88915198ca96c276654',
  used: true,
};

export const validUsedKey = {
  key: '0xaa509e465d947a8c7742e1bba82f3da99ca5e49a5dfb66b7d0c964b6dde2b60e07a12340568dae0b2fded2af494808d0',
  depositSignature:
    '0xac813e4f0138f56a0d6fe7a1cc681176d79125597cb9edda33a189a5b52a0b2cd0bcf41519dd5bb307ce3f64ed37b38d11faa31a32790564721aa5d572395a058ddd12031b55e3f81b3a5992291c68a36f063f24ee51a88915198ca96c276654',
  used: true,
};

export const invalidUsedKey = {
  key: '0xaa509e465d947a8c7742e1bba82f3da99ca5e49a5dfb66b7d0c964b6dde2b60e07a12340568dae0b2fded2af494808d1',
  depositSignature:
    '0xac813e4f0138f56a0d6fe7a1cc681176d79125597cb9edda33a189a5b52a0b2cd0bcf41519dd5bb307ce3f64ed37b38d11faa31a32790564721aa5d572395a058ddd12031b55e3f81b3a5992291c68a36f063f24ee51a88915198ca96c276654',
  used: true,
};

export const validUsedKeyCurrentWC = {
  key: '0xb9cb5f6d464ef72e25fa9b69f87a782eaf60418d0e85344c979b101cf3dcfc5aa68eb85ade0ea99c2af15c39712fc524',
  depositSignature:
    '0xb7b225f21eb951bb3a3265b6574e84815dcceed50df3bd303440e5ea119cab5bd43775bf3b17c173f7f44d207f118ba309357de630c3fa452ef6267ae5bc4e22debece861cdb5b5756250c6c2c65071cf42fba2e52bc0227e02e439f842489ae',
  used: true,
};

export const validUnusedKeyCurrentWC = {
  key: '0x9165ec79bb99edbb6c27e9db669cedc885b42e060fe2c4a4c5c7eed732bff2fa50448589260a178f2383b0949cddbc3d',
  depositSignature:
    '0x9677f0fa3e4531eb2c9cdd7ecb86e330cab024774bbf3950f833d58a11b03ca81c84739b74d2ea60441aed8ee11aa9451242a34c32ac18dda8215f2f016bb27c3c465c37f2a1db7219f9d57ce017baeaf1adf0015fa582a601a3f2d79041059c',
  used: false,
};

export const invalidUnusedKey = {
  key: '0xaa509e465d947a8c7742e1bba82f3da99ca5e49a5dfb66b7d0c964b6dde2b60e07a12340568dae0b2fded2af494808d0',
  depositSignature:
    '0xac813e4f0138f56a0d6fe7a1cc681176d79125597cb9edda33a189a5b52a0b2cd0bcf41519dd5bb307ce3f64ed37b38d11faa31a32790564721aa5d572395a058ddd12031b55e3f81b3a5992291c68a36f063f24ee51a88915198ca96c276654',
  used: false,
};

export const bigKeysBatch10k: Key[] = range(0, 100)
  .map(() => usedValidKeys)
  .flat(1)
  .map((key) => ({
    ...key,
    genesisForkVersion,
    withdrawalCredentials: bufferFromHexString(currentWC),
  }));
