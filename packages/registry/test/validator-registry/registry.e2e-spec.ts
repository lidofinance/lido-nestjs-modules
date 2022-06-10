import { Test } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { simpleTransport, LoggerModule } from '@lido-nestjs/logger';
import {
  BatchProviderModule,
  ExtendedJsonRpcBatchProvider,
} from '@lido-nestjs/execution';
import {
  ValidatorRegistryModule,
  ValidatorRegistryService,
  RegistryStorageService,
} from '../../src/';

describe('Registry', () => {
  let registryService: ValidatorRegistryService;
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
      ValidatorRegistryModule.forFeatureAsync({
        inject: [ExtendedJsonRpcBatchProvider],
        async useFactory(provider: ExtendedJsonRpcBatchProvider) {
          return { provider };
        },
      }),
    ];
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    registryService = moduleRef.get(ValidatorRegistryService);
    storageService = moduleRef.get(RegistryStorageService);

    await storageService.onModuleInit();
  });

  afterEach(async () => {
    await storageService.onModuleDestroy();
  });

  test.skip('Key fetching', async () => {
    await registryService.update(13_600_000);
    const operators = await registryService.getOperatorsFromStorage();
    const keys = await registryService.getValidatorsKeysFromStorage();

    expect(operators.length).toBe(14);
    expect(keys.length).toBe(43976);
  }, 600_000);

  test('Update', async () => {
    // TODO: mock fetch data, test updating
  });
});
