import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ValidatorsRegistryModule,
  ValidatorsRegistry,
  ValidatorsRegistryInterface,
  StorageModule,
} from '../src';
import { MikroORM } from '@mikro-orm/core';
import { migrations } from './helpers/migrations';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { noop } from './helpers/noop';

describe('StorageModule - Sync module initializing', () => {
  let moduleRef: TestingModule | null = null;

  const createTestModules = async (imports: ModuleMetadata['imports']) => {
    moduleRef = await Test.createTestingModule({ imports }).compile();
    await moduleRef.init();
    const validatorsRegistry: ValidatorsRegistryInterface = moduleRef.get(
      ValidatorsRegistryInterface,
    );

    // migrating when starting ORM
    await moduleRef.get(MikroORM).getMigrator().up();

    expect(validatorsRegistry).toBeDefined();
    expect(validatorsRegistry).toBeInstanceOf(ValidatorsRegistry);
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
      ConsensusModule.forRoot({
        imports: [FetchModule.forFeature()],
      }),
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
      ValidatorsRegistryModule.forRoot(),
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
      ValidatorsRegistryModule.forFeature({
        imports: [
          ConsensusModule.forFeature({
            imports: [FetchModule],
          }),
        ],
      }),
    ]);
  });
});
