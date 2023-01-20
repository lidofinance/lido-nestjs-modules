import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  StorageModule,
  StorageService,
  StorageServiceInterface,
} from '../../src';
import { MikroORM } from '@mikro-orm/core';
import { migrations } from '../helpers/migrations';
import { noop } from '../helpers/noop';

describe('StorageModule - Sync module initializing', () => {
  let moduleRef: TestingModule | null = null;

  const createTestModules = async (imports: ModuleMetadata['imports']) => {
    moduleRef = await Test.createTestingModule({ imports }).compile();
    await moduleRef.init();
    const storageService: StorageServiceInterface = moduleRef.get(
      StorageServiceInterface,
    );

    // migrating when starting ORM
    await moduleRef.get(MikroORM).getMigrator().up();

    expect(storageService).toBeDefined();
    expect(storageService).toBeInstanceOf(StorageService);
  };

  afterEach(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();
  });

  afterAll(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();
  });

  test('forRoot', async () => {
    await createTestModules([
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: [...StorageModule.entities],
        migrations: {
          migrationsList: migrations,
        },
        logger: noop,
      }),
      StorageModule.forRoot({}),
    ]);
  });

  test('forFeature', async () => {
    await createTestModules([
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: [...StorageModule.entities],
        migrations: {
          migrationsList: migrations,
        },
        logger: noop,
      }),
      StorageModule.forFeature(),
    ]);
  });
});
