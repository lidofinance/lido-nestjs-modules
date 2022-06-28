import { Test } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { getNetwork } from '@ethersproject/networks';
import { JsonRpcBatchProvider } from '@ethersproject/providers';
import {
  ValidatorRegistryModule,
  ValidatorRegistryService,
  RegistryStorageService,
  RegistryKeyStorageService,
  RegistryMetaStorageService,
  RegistryOperatorStorageService,
  RegistryKeyFetchService,
  RegistryKey,
} from '../../src/';
import {
  keys,
  meta,
  newKey,
  newOperator,
  operators,
  operatorWithDefaultsRecords,
} from '../fixtures/db.fixture';
import {
  clone,
  compareTestMeta,
  compareTestMetaData,
  compareTestMetaKeys,
  compareTestMetaOperators,
} from '../testing.utils';

describe('Registry', () => {
  const provider = new JsonRpcBatchProvider(process.env.EL_RPC_URL);

  let registryService: ValidatorRegistryService;
  let registryStorageService: RegistryStorageService;

  let keyStorageService: RegistryKeyStorageService;
  let metaStorageService: RegistryMetaStorageService;
  let operatorStorageService: RegistryOperatorStorageService;

  let fetchKey: RegistryKeyFetchService;

  const mockCall = jest
    .spyOn(provider, 'call')
    .mockImplementation(async () => '');

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  beforeEach(async () => {
    const imports = [
      MikroOrmModule.forRoot({
        dbName: ':memory:',
        type: 'sqlite',
        allowGlobalContext: true,
        entities: ['./packages/registry/**/*.entity.ts'],
      }),
      LoggerModule.forRoot({ transports: [nullTransport()] }),
      ValidatorRegistryModule.forFeature({ provider }),
    ];

    const moduleRef = await Test.createTestingModule({ imports }).compile();
    registryService = moduleRef.get(ValidatorRegistryService);
    registryStorageService = moduleRef.get(RegistryStorageService);

    keyStorageService = moduleRef.get(RegistryKeyStorageService);
    metaStorageService = moduleRef.get(RegistryMetaStorageService);
    operatorStorageService = moduleRef.get(RegistryOperatorStorageService);

    fetchKey = moduleRef.get(RegistryKeyFetchService);

    await registryStorageService.onModuleInit();

    await keyStorageService.save(keys);
    await metaStorageService.save(meta);
    await operatorStorageService.save(operators);
  });

  afterEach(async () => {
    mockCall.mockReset();
    await registryService.clear();
    await registryStorageService.onModuleDestroy();
  });

  describe('update', () => {
    test('same data', async () => {
      const saveRegistryMock = jest.spyOn(registryService, 'save');
      jest.spyOn(fetchKey, 'fetch').mockImplementation(async () => keys);
      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => meta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => operators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(0);
      await compareTestMeta(registryService, { keys, meta, operators });
    });

    test('new key without keysOpIndex updating', async () => {
      const saveRegistryMock = jest.spyOn(registryService, 'save');
      jest
        .spyOn(fetchKey, 'fetch')
        .mockImplementation(async () => [...keys, newKey]);
      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => meta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => operators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(0);
    });

    test('keys is not added', async () => {
      const newKeys = [...keys, newKey];
      const newMeta = {
        ...meta,
        keysOpIndex: meta.keysOpIndex + 1,
      };
      const saveRegistryMock = jest.spyOn(registryService, 'save');
      jest
        .spyOn(fetchKey, 'fetchOne')
        .mockImplementation(async (operatorIndex, keyIndex) => {
          return newKeys.find(
            (key) =>
              key.index === keyIndex && key.operatorIndex === operatorIndex,
          ) as RegistryKey;
        });
      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => newMeta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => operators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(1);
      await compareTestMetaData(registryService, { meta: newMeta });
      await compareTestMetaKeys(registryService, { keys });
      await compareTestMetaOperators(registryService, { operators });
    });

    test('keys is not mutating', async () => {
      const newKeys = clone(keys);
      newKeys[0].used = false;

      const newMeta = {
        ...meta,
        keysOpIndex: meta.keysOpIndex + 1,
      };
      const saveRegistryMock = jest.spyOn(registryService, 'save');

      jest
        .spyOn(fetchKey, 'fetchOne')
        .mockImplementation(async (operatorIndex, keyIndex) => {
          return newKeys.find(
            (key) =>
              key.index === keyIndex && key.operatorIndex === operatorIndex,
          ) as RegistryKey;
        });

      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => newMeta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => operators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(1);
      await compareTestMetaData(registryService, { meta: newMeta });
      await compareTestMetaKeys(registryService, { keys });
      await compareTestMetaOperators(registryService, { operators });
    });

    test('looking only for used keys', async () => {
      const newKeys = clone([...keys, newKey]);

      const newOperators = clone(operators);
      newOperators[0].totalSigningKeys++;

      const newMeta = {
        ...meta,
        keysOpIndex: meta.keysOpIndex + 1,
      };

      const saveRegistryMock = jest.spyOn(registryService, 'save');

      jest
        .spyOn(fetchKey, 'fetchOne')
        .mockImplementation(async (operatorIndex, keyIndex) => {
          return newKeys.find(
            (key) =>
              key.index === keyIndex && key.operatorIndex === operatorIndex,
          ) as RegistryKey;
        });

      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => newMeta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => newOperators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(1);
      await compareTestMetaData(registryService, { meta: newMeta });
      await compareTestMetaKeys(registryService, { keys: keys });
      await compareTestMetaOperators(registryService, {
        operators: newOperators,
      });
    });

    test('add new operator', async () => {
      const newOperators = clone([...operators, newOperator]);

      const newMeta = {
        ...meta,
        keysOpIndex: meta.keysOpIndex + 1,
      };

      const saveRegistryMock = jest.spyOn(registryService, 'save');

      jest
        .spyOn(fetchKey, 'fetchOne')
        .mockImplementation(async (operatorIndex, keyIndex) => {
          return keys.find(
            (key) =>
              key.index === keyIndex && key.operatorIndex === operatorIndex,
          ) as RegistryKey;
        });

      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => newMeta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => newOperators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(1);
      await compareTestMetaData(registryService, { meta: newMeta });
      await compareTestMetaKeys(registryService, { keys: keys });
      await compareTestMetaOperators(registryService, {
        operators: newOperators,
      });
    });

    test('add operator with default records', async () => {
      const newOperators = clone([...operators, operatorWithDefaultsRecords]);

      const newMeta = {
        ...meta,
        keysOpIndex: meta.keysOpIndex + 1,
      };

      const saveRegistryMock = jest.spyOn(registryService, 'save');

      jest
        .spyOn(fetchKey, 'fetchOne')
        .mockImplementation(async (operatorIndex, keyIndex) => {
          return keys.find(
            (key) =>
              key.index === keyIndex && key.operatorIndex === operatorIndex,
          ) as RegistryKey;
        });

      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => newMeta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => newOperators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(1);
      await compareTestMetaData(registryService, { meta: newMeta });
      await compareTestMetaKeys(registryService, { keys: keys });
      await compareTestMetaOperators(registryService, {
        operators: newOperators,
      });
    });

    test('delete keys from operator', async () => {
      const newOperators = clone(operators);
      newOperators[0].usedSigningKeys--;

      const newMeta = {
        ...meta,
        keysOpIndex: meta.keysOpIndex + 1,
      };

      const saveRegistryMock = jest.spyOn(registryService, 'save');

      jest
        .spyOn(fetchKey, 'fetchOne')
        .mockImplementation(async (operatorIndex, keyIndex) => {
          return keys.find(
            (key) =>
              key.index === keyIndex && key.operatorIndex === operatorIndex,
          ) as RegistryKey;
        });

      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => newMeta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => newOperators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(1);
      await compareTestMetaData(registryService, { meta: newMeta });
      await compareTestMetaKeys(registryService, { keys: keys });
      await compareTestMetaOperators(registryService, {
        operators: newOperators,
      });
    });

    test('out of total signing keys limit', async () => {
      const newOperators = clone(operators);
      newOperators[0].totalSigningKeys--;

      const newMeta = {
        ...meta,
        keysOpIndex: meta.keysOpIndex + 1,
      };

      const saveRegistryMock = jest.spyOn(registryService, 'save');

      jest
        .spyOn(fetchKey, 'fetchOne')
        .mockImplementation(async (operatorIndex, keyIndex) => {
          return keys.find(
            (key) =>
              key.index === keyIndex && key.operatorIndex === operatorIndex,
          ) as RegistryKey;
        });

      jest
        .spyOn(registryService, 'getMetaDataFromContract')
        .mockImplementation(async () => newMeta);
      jest
        .spyOn(registryService, 'getOperatorsFromContract')
        .mockImplementation(async () => newOperators);

      await registryService.update('latest');
      expect(saveRegistryMock).toBeCalledTimes(1);
      await compareTestMetaData(registryService, { meta: newMeta });
      await compareTestMetaOperators(registryService, {
        operators: newOperators,
      });

      const firstOperatorKeys = await (
        await registryService.getOperatorsKeysFromStorage()
      ).filter(({ operatorIndex }) => operatorIndex === 0);

      expect(firstOperatorKeys.length).toBe(newOperators[0].totalSigningKeys);
    });
  });
});
