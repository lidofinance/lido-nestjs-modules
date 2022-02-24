import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getNetwork } from '@ethersproject/networks';
import { getDefaultProvider } from '@ethersproject/providers';
import {
  LidoContractModule,
  RegistryContractModule,
} from '@lido-nestjs/contracts';
import { RegistryFetchModule, RegistryFetchService } from '../../src';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const fetchService: RegistryFetchService =
      moduleRef.get(RegistryFetchService);

    expect(fetchService).toBeDefined();
  };

  test('forRoot', async () => {
    await testModules([
      LidoContractModule.forRoot({ provider }),
      RegistryContractModule.forRoot({ provider }),
      RegistryFetchModule.forRoot({}),
    ]);
  });

  test('forFeature', async () => {
    await testModules([
      LidoContractModule.forRoot({ provider }),
      RegistryContractModule.forRoot({ provider }),
      RegistryFetchModule.forFeature({}),
    ]);
  });
});
