import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RegistryModule, RegistryService } from '../src';

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const registryService: RegistryService = moduleRef.get(RegistryService);

    expect(registryService.updateStoredData).toBeDefined();
  };

  test('forRoot', async () => {
    await testModules([RegistryModule.forRoot({})]);
  });

  test('forFeature', async () => {
    await testModules([RegistryModule.forFeature({})]);
  });
});
