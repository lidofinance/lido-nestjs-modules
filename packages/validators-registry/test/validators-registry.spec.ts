/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ValidatorsRegistryModule,
  ValidatorsRegistryInterface,
  StorageModule,
  Validator,
  ValidatorStatusType,
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

    expect(metaAndValidators).toStrictEqual({
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

    expect(metaAndValidators).toStrictEqual({
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

    expect(metaAndValidators).toStrictEqual({
      validators: expectedValidators,
      meta: consensusMetaB,
    });
  });

  test('update (no execution_payload in consensus block)', async () => {
    await expect(validatorsRegistry.update(slotC)).rejects.toBeInstanceOf(
      z.ZodError,
    );
  });

  test('update (non-array validators response from consensus)', async () => {
    await expect(validatorsRegistry.update(slotD)).rejects.toStrictEqual(
      new RangeError('Validators must be array'),
    );
  });

  test('update (bad consensus header data)', async () => {
    const getBlockHeaderMock = jest.spyOn<any, any>(
      consensusServiceMock,
      'getBlockHeader',
    );

    getBlockHeaderMock.mockImplementation(() => undefined);
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      z.ZodError,
    );

    getBlockHeaderMock.mockImplementation(() => ({
      data: null,
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      z.ZodError,
    );

    getBlockHeaderMock.mockImplementation(() => ({
      data: {},
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      z.ZodError,
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
      z.ZodError,
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
      z.ZodError,
    );

    getStateValidatorsMock.mockImplementation(() => ({
      data: [{}],
    }));
    await expect(validatorsRegistry.update('finalized')).rejects.toBeInstanceOf(
      z.ZodError,
    );
  });
});
