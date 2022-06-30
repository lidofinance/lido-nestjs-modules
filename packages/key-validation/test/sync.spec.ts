import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LidoKeyValidatorModule, LidoKeyValidator } from '../src';
import { LidoContractModule } from '@lido-nestjs/contracts';
import { getDefaultProvider } from '@ethersproject/providers';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const fetchService = moduleRef.get(LidoKeyValidator);

    expect(fetchService.validateKey).toBeDefined();
    expect(fetchService.validateKeys).toBeDefined();
  };

  test('Module', async () => {
    await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule,
    ]);
  });

  test('forRoot', async () => {
    await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule.forRoot(),
    ]);
  });

  test('forFeature', async () => {
    await testModules([
      LidoContractModule.forRoot({ provider }),
      LidoKeyValidatorModule.forFeature(),
    ]);
  });
});
