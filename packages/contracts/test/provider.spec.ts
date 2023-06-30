/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Wallet, getDefaultProvider, Network } from 'ethers';
import { Lido, LidoContractModule, LIDO_CONTRACT_TOKEN } from '../src';

const privateKey = '0x12';

describe('Providers', () => {
  const provider = getDefaultProvider(
    process.env.EL_RPC_URL ?? 'http://localhost:8545',
  );

  jest
    .spyOn(provider, '_detectNetwork')
    .mockImplementation(async () => new Network('mainnet', 1));

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
