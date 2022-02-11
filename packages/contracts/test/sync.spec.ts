import { getDefaultProvider } from '@ethersproject/providers';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Lido, LidoContractModule, LIDO_CONTRACT_TOKEN } from '../src';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider('mainnet');

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const contract: Lido = moduleRef.get(LIDO_CONTRACT_TOKEN);

    expect(contract.name).toBeDefined();
    expect(contract.symbol).toBeDefined();
  };

  test('forRoot', async () => {
    await testModules([LidoContractModule.forRoot({ provider })]);
  });

  test('forFeature', async () => {
    await testModules([LidoContractModule.forFeature({ provider })]);
  });
});
