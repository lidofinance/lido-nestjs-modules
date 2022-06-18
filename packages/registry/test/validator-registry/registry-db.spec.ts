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
  RegistryKeyStorageService,
  RegistryMetaStorageService,
  RegistryOperatorStorageService,
} from '../../src/';
import { keys, meta, operators } from './mock-data';

describe('Registry', () => {
  let registryService: ValidatorRegistryService;
  let registryStorageService: RegistryStorageService;

  let keyStorageService: RegistryKeyStorageService;
  let metaStorageService: RegistryMetaStorageService;
  let operatorStorageService: RegistryOperatorStorageService;

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
    registryStorageService = moduleRef.get(RegistryStorageService);

    keyStorageService = moduleRef.get(RegistryKeyStorageService);
    metaStorageService = moduleRef.get(RegistryMetaStorageService);
    operatorStorageService = moduleRef.get(RegistryOperatorStorageService);

    await registryStorageService.onModuleInit();

    await keyStorageService.save(keys);
    await metaStorageService.save(meta);
    await operatorStorageService.save(operators);
  });

  afterEach(async () => {
    await registryService.clear();
    await registryStorageService.onModuleDestroy();
  });

  test('db init is correct', async () => {
    expect(keys.sort((a, b) => a.operatorIndex - b.operatorIndex)).toEqual(
      await (
        await registryService.getOperatorsKeysFromStorage()
      ).sort((a, b) => a.operatorIndex - b.operatorIndex),
    );
    expect(operators).toEqual(await registryService.getOperatorsFromStorage());
    expect(meta).toEqual(await registryService.getMetaDataFromStorage());
  });

  test('update existing key', async () => {
    const updatedOne = { ...keys[0], used: false };
    const updatedTwo = { ...keys[1], used: false };

    await registryService.save([updatedOne, updatedTwo], operators, meta);
    const keysFromStorage = await registryService.getOperatorsKeysFromStorage();

    expect(updatedOne).toEqual(keysFromStorage[0]);
    expect(updatedTwo).toEqual(keysFromStorage[1]);
  });
});
