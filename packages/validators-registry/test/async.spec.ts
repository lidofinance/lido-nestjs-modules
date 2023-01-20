import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Injectable, Module } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ValidatorsRegistryModule,
  ValidatorsRegistry,
  ValidatorsRegistryInterface,
  ValidatorsRegistryModuleAsyncOptions,
  StorageModule,
} from '../src';
import { MikroORM } from '@mikro-orm/core';
import { migrations } from './helpers/migrations';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { noop } from './helpers/noop';

@Injectable()
class TestService {}
@Module({
  providers: [TestService],
  exports: [TestService],
})
class TestModule {
  static forRoot(): DynamicModule {
    return {
      module: TestModule,
      global: true,
    };
  }
}

describe('StorageModule - Async module initializing', () => {
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

  test('forRootAsync', async () => {
    const options: ValidatorsRegistryModuleAsyncOptions = {
      async useFactory() {
        return {};
      },
      inject: [TestService],
    };

    await createTestModules([
      TestModule.forRoot(),
      ConsensusModule.forRoot({ imports: [FetchModule.forFeature()] }),
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
      ValidatorsRegistryModule.forRootAsync(options),
    ]);
  });

  test('forFeatureAsync', async () => {
    const options: ValidatorsRegistryModuleAsyncOptions = {
      async useFactory() {
        return {};
      },
      inject: [TestService],
    };

    await createTestModules([
      TestModule.forRoot(),
      ConsensusModule.forRoot({ imports: [FetchModule.forFeature()] }),
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
      ValidatorsRegistryModule.forFeatureAsync(options),
    ]);
  });
});
