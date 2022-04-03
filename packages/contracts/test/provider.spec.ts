/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDefaultProvider } from '@ethersproject/providers';
import { getNetwork } from '@ethersproject/networks';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Wallet } from 'ethers';
import { Lido, LidoContractModule, LIDO_CONTRACT_TOKEN } from '../src';

const privateKey = '0x12';

describe('Providers', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  const signer = new Wallet(privateKey, provider);

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const contract: Lido = moduleRef.get(LIDO_CONTRACT_TOKEN);

    expect(contract.name).toBeDefined();
    expect(contract.symbol).toBeDefined();
  };

  test('Provider', async () => {
    await testModules([LidoContractModule.forRoot({ provider })]);
  });

  test('Provider', async () => {
    await testModules([LidoContractModule.forRoot({ provider: signer })]);
  });

  test('Unknown', async () => {
    await expect(() =>
      testModules([LidoContractModule.forRoot({ provider: {} as any })]),
    ).rejects.toThrow();
  });
});
