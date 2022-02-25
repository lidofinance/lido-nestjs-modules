import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RegistryStorageModule, RegistryStorageService } from '../../src';

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const storageService: RegistryStorageService = moduleRef.get(
      RegistryStorageService,
    );

    await storageService.onModuleInit();
    expect(storageService).toBeDefined();
    await storageService.onModuleDestroy();
  };

  test('forRoot', async () => {
    await testModules([
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: ['./packages/registry/**/*.entity.ts'],
      }),
      RegistryStorageModule.forRoot({}),
    ]);
  });

  test('forFeature', async () => {
    await testModules([
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: ['./packages/registry/**/*.entity.ts'],
      }),
      RegistryStorageModule.forFeature(),
    ]);
  });
});
