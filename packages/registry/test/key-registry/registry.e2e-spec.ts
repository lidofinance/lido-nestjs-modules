import { Test } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { simpleTransport, LoggerModule } from '@lido-nestjs/logger';
import {
  BatchProviderModule,
  ExtendedJsonRpcBatchProvider,
} from '@lido-nestjs/execution';

import { KeyRegistryModule } from '../../src/main/key-registry/key-registry.module';
import { KeyRegistryService } from '../../src/main/key-registry/key-registry.service';
import { RegistryStorageService } from '../../src/storage/registry-storage.service';

describe('Registry', () => {
  let registryService: KeyRegistryService;
  let storageService: RegistryStorageService;

  beforeEach(async () => {
    const imports = [
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: ['./packages/registry/**/*.entity.ts'],
      }),
      BatchProviderModule.forRoot({ url: process.env.EL_RPC_URL as string }),
      LoggerModule.forRoot({ transports: [simpleTransport()] }),
      KeyRegistryModule.forFeatureAsync({
        inject: [ExtendedJsonRpcBatchProvider],
        async useFactory(provider: ExtendedJsonRpcBatchProvider) {
          return { provider };
        },
      }),
    ];
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    registryService = moduleRef.get(KeyRegistryService);
    storageService = moduleRef.get(RegistryStorageService);

    await storageService.onModuleInit();
  });

  afterEach(async () => {
    await storageService.onModuleDestroy();
  });

  test.skip('Key fetching', async () => {
    await registryService.update(13_600_000);
    const operators = await registryService.getOperatorsFromStorage();
    const keys = await registryService.getAllKeysFromStorage();

    expect(operators.length).toBe(14);
    expect(keys.length).toBe(58250);
  }, 600_000);

  test('Update', async () => {
    // TODO: mock fetch data, test updating
  });
});