import { Test } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import {
  BatchProviderModule,
  ExtendedJsonRpcBatchProvider,
} from '@lido-nestjs/execution';

import {
  KeyRegistryModule,
  KeyRegistryService,
  RegistryStorageService,
} from '../../src/';

import {
  compareTestMetaData,
  compareTestMetaOperators,
} from '../testing.utils';

import {
  firstKey,
  lastKey,
  meta,
  operators,
} from '../fixtures/connect.fixture';

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
      LoggerModule.forRoot({ transports: [nullTransport()] }),
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

  test('Update', async () => {
    await registryService.update(6912872);

    await compareTestMetaData(registryService, { meta: meta });

    await compareTestMetaOperators(registryService, {
      operators: operators,
    });

    const keys = await registryService.getAllKeysFromStorage();

    const firstKeyFromDB = keys[0];
    const lastKeyFromDB = keys[keys.length - 1];

    expect(firstKeyFromDB).toEqual(firstKey);
    expect(lastKeyFromDB).toEqual(lastKey);
  }, 200_000);
});
