import { Test } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { key } from '../fixtures/key.fixture';
import {
  RegistryStorageModule,
  RegistryStorageService,
  RegistryKeyStorageService,
} from '../../src';

describe('Keys', () => {
  let storageService: RegistryKeyStorageService;
  let registryService: RegistryStorageService;

  beforeEach(async () => {
    const imports = [
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: ['./packages/registry/**/key.entity.ts'],
      }),
      RegistryStorageModule.forFeature(),
    ];

    const moduleRef = await Test.createTestingModule({ imports }).compile();
    storageService = moduleRef.get(RegistryKeyStorageService);
    registryService = moduleRef.get(RegistryStorageService);

    await registryService.onModuleInit();
  });

  afterEach(async () => {
    await registryService.onModuleDestroy();
  });

  test('save one key', async () => {
    const registryKey = { operatorIndex: 1, index: 1, ...key };

    await expect(storageService.findAll()).resolves.toEqual([]);
    await storageService.saveOne(registryKey);
    await expect(storageService.findAll()).resolves.toEqual([registryKey]);
  });

  test('save keys', async () => {
    const keys = [
      { operatorIndex: 1, index: 1, ...key },
      { operatorIndex: 1, index: 2, ...key },
    ];

    await expect(storageService.findAll()).resolves.toEqual([]);
    await storageService.save(keys);
    await expect(storageService.findAll()).resolves.toEqual(keys);
  });

  test('remove one key', async () => {
    const registryKey = { operatorIndex: 1, index: 1, ...key };

    await expect(storageService.findAll()).resolves.toEqual([]);
    await storageService.saveOne(registryKey);
    await expect(storageService.findAll()).resolves.toEqual([registryKey]);
    await storageService.removeOneByIndex(
      registryKey.operatorIndex,
      registryKey.index,
    );
    await expect(storageService.findAll()).resolves.toEqual([]);
  });

  test('remove all keys', async () => {
    const keys = [
      { operatorIndex: 1, index: 1, ...key },
      { operatorIndex: 1, index: 2, ...key },
    ];

    await expect(storageService.findAll()).resolves.toEqual([]);
    await storageService.save(keys);
    await expect(storageService.findAll()).resolves.toEqual(keys);
    await storageService.removeAll();
    await expect(storageService.findAll()).resolves.toEqual([]);
  });
});
