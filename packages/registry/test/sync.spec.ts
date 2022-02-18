import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getNetwork } from '@ethersproject/networks';
import { getDefaultProvider } from '@ethersproject/providers';
import { RegistryContractModule } from '@lido-nestjs/contracts';
import { RegistryModule, RegistryService } from '../src';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const registryService: RegistryService = moduleRef.get(RegistryService);

    expect(registryService.updateStoredData).toBeDefined();
  };

  test('forRoot', async () => {
    await testModules([
      RegistryContractModule.forRoot({ provider }),
      RegistryModule.forRoot({}),
    ]);
  });

  test('forFeature', async () => {
    await testModules([
      RegistryContractModule.forRoot({ provider }),
      RegistryModule.forFeature({}),
    ]);
  });
});
