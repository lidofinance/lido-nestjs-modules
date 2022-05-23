import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { getNetwork } from '@ethersproject/networks';
import { getDefaultProvider } from '@ethersproject/providers';
import {
  ValidatorRegistryModule,
  ValidatorRegistryService,
  RegistryStorageService,
} from '../../src';

describe('Async module initializing', () => {
  const provider = getDefaultProvider('mainnet');

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    const registryService: ValidatorRegistryService = moduleRef.get(
      ValidatorRegistryService,
    );
    const storageService = moduleRef.get(RegistryStorageService);

    await storageService.onModuleInit();
    expect(registryService).toBeDefined();
    await storageService.onModuleDestroy();
  };

  test('forRootAsync', async () => {
    await testModules([
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: ['./packages/registry/**/*.entity.ts'],
      }),
      LoggerModule.forRoot({ transports: [nullTransport()] }),
      ValidatorRegistryModule.forRootAsync({
        async useFactory() {
          return { provider };
        },
      }),
    ]);
  });

  test('forFeatureAsync', async () => {
    await testModules([
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: ['./packages/registry/**/*.entity.ts'],
      }),
      LoggerModule.forRoot({ transports: [nullTransport()] }),
      ValidatorRegistryModule.forFeatureAsync({
        async useFactory() {
          return { provider };
        },
      }),
    ]);
  });
});
