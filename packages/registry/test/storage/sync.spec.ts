import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RegistryStorageModule, RegistryStorageService } from '../../src';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const storageService: RegistryStorageService = moduleRef.get(
      RegistryStorageService,
    );

    const generator = moduleRef.get(MikroORM).getSchemaGenerator();
    await generator.updateSchema();

    expect(storageService).toBeDefined();
    await storageService.onModuleDestroy();
  };

  test('forRoot', async () => {
    await testModules([
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        driver: SqliteDriver,
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
        driver: SqliteDriver,
        allowGlobalContext: true,
        entities: ['./packages/registry/**/*.entity.ts'],
      }),
      RegistryStorageModule.forFeature(),
    ]);
  });
});
