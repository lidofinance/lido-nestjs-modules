/* eslint-disable @typescript-eslint/no-explicit-any */
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ValidatorsRegistryModule,
  ValidatorsRegistryInterface,
  StorageModule,
  Validator,
  ValidatorStatusType,
  ConsensusDataInvalidError,
} from '../src';
import { MikroORM } from '@mikro-orm/core';
import { migrations } from './helpers/migrations';
import { ConsensusModule, ConsensusService } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import {
  blocks,
  consensusMetaA,
  consensusMetaB,
  headers,
  slotA,
  slotB,
  slotC,
  slotD,
  stateValidators,
  stateValidatorsA,
  stateValidatorsB,
} from './fixtures/consensus';
import { noop } from './helpers/noop';
import { Readable } from 'stream';

describe('StorageModule', () => {
  let moduleRef: TestingModule | null = null;
  let validatorsRegistry: ValidatorsRegistryInterface;

  const consensusServiceMock = {
    getBlockV2: (args: { blockId: string | number }) => {
      return blocks[args.blockId];
    },
    getBlockHeader: (args: { blockId: string | number }) => {
      return headers[args.blockId];
    },
    getStateValidators: (args: { stateId: string }) => {
      return stateValidators[args.stateId];
    },
  };

  beforeEach(async () => {
    const imports = [
      ConsensusModule.forRoot({
        imports: [FetchModule],
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
      ValidatorsRegistryModule.forFeature(),
    ];

    moduleRef = await Test.createTestingModule({ imports })
      .overrideProvider(ConsensusService)
      .useValue(consensusServiceMock)
      .compile();

    await moduleRef.init();
    validatorsRegistry = moduleRef.get<ValidatorsRegistryInterface>(
      ValidatorsRegistryInterface,
    );

    // migrating when starting ORM
    await moduleRef.get(MikroORM).getMigrator().up();
  });

  afterEach(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();

    jest.clearAllMocks();
  });

  afterAll(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();
  });

  test('getMeta - null when empty', async () => {
    const meta = await validatorsRegistry.getMeta();

    expect(meta).toBe(null);
  });

  test('getValidators - null when empty', async () => {
    const metaAndValidators = await validatorsRegistry.getValidators();

    expect(metaAndValidators).toStrictEqual({
      validators: [],
      meta: null,
    });
  });

  test('getMeta - null when empty', async () => {
    const meta = await validatorsRegistry.getMeta();

    expect(meta).toStrictEqual(null);
  });

  test('update (get first state)', async () => {
    await validatorsRegistry.update(slotA);

    const meta = await validatorsRegistry.getMeta();
    const metaAndValidators = await validatorsRegistry.getValidators();

    const expectedValidators: Validator[] = [
      {
        index: Number(stateValidatorsA.data[0].index),
        pubkey: stateValidatorsA.data[0].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsA.data[0].status),
      },
      {
        index: Number(stateValidatorsA.data[1].index),
        pubkey: stateValidatorsA.data[1].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsA.data[1].status),
      },
    ];

    expect(meta).toStrictEqual(consensusMetaA);

    expect(metaAndValidators).toEqual({
      validators: expectedValidators,
      meta: consensusMetaA,
    });
  });

  test('update(get first state) + update(no newer state)', async () => {
    await validatorsRegistry.update(slotA);
    await validatorsRegistry.update(slotA);

    const meta = await validatorsRegistry.getMeta();
    const metaAndValidators = await validatorsRegistry.getValidators();

    expect(meta).toStrictEqual(consensusMetaA);

    const expectedValidators: Validator[] = [
      {
        index: Number(stateValidatorsA.data[0].index),
        pubkey: stateValidatorsA.data[0].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsA.data[0].status),
      },
      {
        index: Number(stateValidatorsA.data[1].index),
        pubkey: stateValidatorsA.data[1].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsA.data[1].status),
      },
    ];

    expect(metaAndValidators).toEqual({
      validators: expectedValidators,
      meta: consensusMetaA,
    });
  });

  test('update(get first state) + update(get newer state)', async () => {
    await validatorsRegistry.update(slotA);
    await validatorsRegistry.update(slotB);

    const meta = await validatorsRegistry.getMeta();
    const metaAndValidators = await validatorsRegistry.getValidators();

    expect(meta).toStrictEqual(consensusMetaB);

    const expectedValidators: Validator[] = [
      {
        index: Number(stateValidatorsB.data[0].index),
        pubkey: stateValidatorsB.data[0].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsB.data[0].status),
      },
      {
        index: Number(stateValidatorsB.data[1].index),
        pubkey: stateValidatorsB.data[1].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsB.data[1].status),
      },
      {
        index: Number(stateValidatorsB.data[2].index),
        pubkey: stateValidatorsB.data[2].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsB.data[2].status),
      },
    ];

    expect(metaAndValidators).toEqual({
      validators: expectedValidators,
      meta: consensusMetaB,
    });
  });

  test('update (no execution_payload in consensus block)', async () => {
    await expect(validatorsRegistry.update(slotC)).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );
  });

  test('update (non-array validators response from consensus)', async () => {
    await expect(validatorsRegistry.update(slotD)).rejects.toStrictEqual(
      new ConsensusDataInvalidError('Validators must be array'),
    );
  });

  test('update (bad consensus header data)', async () => {
    const getBlockHeaderMock = jest.spyOn<any, any>(
      consensusServiceMock,
      'getBlockHeader',
    );

    getBlockHeaderMock.mockImplementation(() => undefined);
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );

    getBlockHeaderMock.mockImplementation(() => ({
      data: null,
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );

    getBlockHeaderMock.mockImplementation(() => ({
      data: {},
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );
  });

  test('update (bad consensus block data)', async () => {
    const getBlockV2Mock = jest.spyOn<any, any>(
      consensusServiceMock,
      'getBlockV2',
    );

    getBlockV2Mock.mockImplementation(() => undefined);
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );

    getBlockV2Mock.mockImplementation(() => ({
      data: null,
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );

    getBlockV2Mock.mockImplementation(() => ({
      data: {},
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );

    getBlockV2Mock.mockImplementation(() => ({
      data: {
        message: {
          slot: 42,
          state_root:
            '0x07b015be475bfb9e17a0203e8ec4c636a5d1fe1bab9c55c27193f8e6e67e76f5',
          body: {
            execution_payload: {
              block_hash: '0x01',
            },
          },
        },
      },
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );
  });

  test('update (bad validators data)', async () => {
    const getStateValidatorsMock = jest.spyOn<any, any>(
      consensusServiceMock,
      'getStateValidators',
    );

    getStateValidatorsMock.mockImplementation(() => ({
      data: [null],
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );

    getStateValidatorsMock.mockImplementation(() => ({
      data: [
        {
          index: 123,
          status: 'active_ongoing',
          validator: null,
        },
      ],
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );

    getStateValidatorsMock.mockImplementation(() => ({
      data: [{}],
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );
  });
});

describe('updateStream', () => {
  let moduleRef: TestingModule | null = null;
  let validatorsRegistry: ValidatorsRegistryInterface;

  const consensusServiceMock = {
    getBlockV2: (args: { blockId: string | number }) => {
      return blocks[args.blockId];
    },
    getBlockHeader: (args: { blockId: string | number }) => {
      return headers[args.blockId];
    },
    getStateValidatorsStream: (args: { stateId: string }) => {
      return Readable.from(JSON.stringify(stateValidators[args.stateId]));
    },
  };

  beforeEach(async () => {
    const imports = [
      ConsensusModule.forRoot({
        imports: [FetchModule],
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
      ValidatorsRegistryModule.forFeature(),
    ];

    moduleRef = await Test.createTestingModule({ imports })
      .overrideProvider(ConsensusService)
      .useValue(consensusServiceMock)
      .compile();

    await moduleRef.init();
    validatorsRegistry = moduleRef.get<ValidatorsRegistryInterface>(
      ValidatorsRegistryInterface,
    );

    // migrating when starting ORM
    await moduleRef.get(MikroORM).getMigrator().up();
  });

  afterEach(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();

    jest.clearAllMocks();
  });

  afterAll(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();
  });

  test('getMeta - null when empty', async () => {
    const meta = await validatorsRegistry.getMeta();

    expect(meta).toBe(null);
  });

  test('getValidators - null when empty', async () => {
    const metaAndValidators = await validatorsRegistry.getValidators();

    expect(metaAndValidators).toStrictEqual({
      validators: [],
      meta: null,
    });
  });

  test('updateStream, empty state', async () => {
    await validatorsRegistry.updateStream(slotA);

    const meta = await validatorsRegistry.getMeta();
    const metaAndValidators = await validatorsRegistry.getValidators();

    const expectedValidators: Validator[] = [
      {
        index: Number(stateValidatorsA.data[0].index),
        pubkey: stateValidatorsA.data[0].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsA.data[0].status),
      },
      {
        index: Number(stateValidatorsA.data[1].index),
        pubkey: stateValidatorsA.data[1].validator.pubkey,
        status: ValidatorStatusType.parse(stateValidatorsA.data[1].status),
      },
    ];

    expect(meta).toStrictEqual(consensusMetaA);

    expect(metaAndValidators).toEqual({
      validators: expectedValidators,
      meta: consensusMetaA,
    });
  });

  test('updateStream, meta was not changed', async () => {
    const mockBlockV2 = jest.spyOn(consensusServiceMock, 'getBlockV2');
    await validatorsRegistry.updateStream(slotA);
    expect(mockBlockV2).toBeCalledTimes(1);
    mockBlockV2.mockClear();
    await validatorsRegistry.updateStream(slotA);
    expect(mockBlockV2).toBeCalledTimes(0);
  });
});
