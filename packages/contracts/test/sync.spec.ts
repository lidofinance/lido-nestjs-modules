import {
  getDefaultProvider,
  AbstractProvider as Provider,
  Network,
} from 'ethers';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Lido, LidoContractModule, LIDO_CONTRACT_TOKEN } from '../src';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider(
    process.env.EL_RPC_URL ?? 'http://localhost:8545',
  );

  jest
    .spyOn(provider, '_detectNetwork')
    .mockImplementation(async () => new Network('mainnet', 1));

  const testModules = async (metadata: ModuleMetadata) => {
    const moduleRef = await Test.createTestingModule(metadata).compile();
    const contract: Lido = moduleRef.get(LIDO_CONTRACT_TOKEN);

    expect(contract.name).toBeDefined();
    expect(contract.symbol).toBeDefined();
  };

  test('forRoot with provider', async () => {
    const imports = [LidoContractModule.forRoot()];
    const metadata = {
      imports,
      providers: [{ provide: Provider, useValue: provider }],
    };
    await testModules(metadata);
  });

  test('forFeature with provider', async () => {
    const imports = [LidoContractModule.forFeature()];
    const metadata = {
      imports,
      providers: [{ provide: Provider, useValue: provider }],
    };
    await testModules(metadata);
  });

  test('forRoot without provider', async () => {
    const imports = [LidoContractModule.forRoot()];
    const metadata = { imports };

    await expect(() => testModules(metadata)).rejects.toThrowError();
  });

  test('forFeature without provider', async () => {
    const imports = [LidoContractModule.forFeature()];
    const metadata = { imports };

    await expect(() => testModules(metadata)).rejects.toThrowError();
  });
});
