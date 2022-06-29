/* eslint-disable @typescript-eslint/ban-ts-comment */
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
} from '../../src/';
import { keys, meta, operators } from '../fixtures/db.fixture';

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

describe('Registry', () => {
  const provider = new JsonRpcBatchProvider(process.env.EL_RPC_URL);

  let registryService: ValidatorRegistryService;
  let registryStorageService: RegistryStorageService;

  let keyStorageService: RegistryKeyStorageService;
  let metaStorageService: RegistryMetaStorageService;
  let operatorStorageService: RegistryOperatorStorageService;

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
      ValidatorRegistryModule.forFeature({
        provider,
        subscribeInterval: '*/2 * * * * *',
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
    mockCall.mockReset();
    await registryService.clear();
    await registryStorageService.onModuleDestroy();
  });

  describe('subscribe', () => {
    test('empty data', async () => {
      //@ts-ignore
      jest.spyOn(registryService, 'update').mockImplementation(async () => {
        return [];
      });

      const unSub = registryService.subscribe((error, payload) => {
        expect(error).toBe(null);
        expect(payload).toEqual([]);
        unSub();
      });
      await wait(3000);
      expect.assertions(2);
    });

    test('some data', async () => {
      //@ts-ignore
      jest.spyOn(registryService, 'update').mockImplementation(async () => {
        return 1;
      });

      const unSub = registryService.subscribe((error, payload) => {
        expect(error).toBe(null);
        expect(payload).toEqual(1);
        unSub();
      });
      await wait(3000);
      expect.assertions(2);
    });

    test('error', async () => {
      //@ts-ignore
      jest.spyOn(registryService, 'update').mockImplementation(async () => {
        throw new Error('some error');
      });

      const unSub = registryService.subscribe((error, payload) => {
        expect(error).toBeDefined();
        expect(payload).toBeUndefined();
        unSub();
      });
      await wait(3000);
      expect.assertions(2);
    });
  });
});
