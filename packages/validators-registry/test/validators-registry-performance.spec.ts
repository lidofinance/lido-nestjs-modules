/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ValidatorsRegistryModule,
  ValidatorsRegistryInterface,
  StorageModule,
} from '../src';
import { MikroORM } from '@mikro-orm/core';
import { migrations } from './helpers/migrations';
import { ConsensusModule, ConsensusService } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { blockA, headerA } from './fixtures/consensus';
import { noop } from './helpers/noop';
import { createStateValidators } from './helpers/create-validators';
import { withTimer } from '@lido-nestjs/utils';

describe('StorageModule - performance tests', () => {
  jest.setTimeout(1000000);

  let moduleRef: TestingModule | null = null;
  let validatorsRegistry: ValidatorsRegistryInterface;

  let stateValidators: ReturnType<typeof createStateValidators>;

  const consensusServiceMock = {
    getBlockV2: () => {
      return blockA;
    },
    getBlockHeader: () => {
      return headerA;
    },
    getStateValidators: () => {
      return stateValidators;
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

    // await moduleRef
    //   .get<MikroORM>(MikroORM)
    //   .getSchemaGenerator()
    //   .clearDatabase();

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

  test('performance - 10k validators', async () => {
    stateValidators = createStateValidators(10_000);

    const [_, secondsForUpdate] = await withTimer(
      async () => await validatorsRegistry.update('finalized'),
    );

    expect(secondsForUpdate).toBeLessThan(2);

    const [metaAndValidators, secondsForGet] = await withTimer(
      async () => await validatorsRegistry.getValidators(),
    );

    expect(secondsForGet).toBeLessThan(2);

    expect(metaAndValidators.validators.length).toBe(10_000);
  });

  test('performance - 10k validators with filter 100 pubkeys', async () => {
    stateValidators = createStateValidators(10_000);

    const [_, secondsForUpdate] = await withTimer(
      async () => await validatorsRegistry.update('finalized'),
    );

    expect(secondsForUpdate).toBeLessThan(2);

    const pubkeys = stateValidators.data
      .map((x) => x.validator.pubkey)
      .slice(0, 100);

    const [metaAndValidators, secondsForGet] = await withTimer(
      async () => await validatorsRegistry.getValidators(pubkeys),
    );

    expect(secondsForGet).toBeLessThan(2);

    expect(metaAndValidators.validators.length).toBe(100);
  });

  test('performance - 10k validators with filter 1000 pubkeys', async () => {
    stateValidators = createStateValidators(10_000);

    const [_, secondsForUpdate] = await withTimer(
      async () => await validatorsRegistry.update('finalized'),
    );

    expect(secondsForUpdate).toBeLessThan(2);

    const pubkeys = stateValidators.data
      .map((x) => x.validator.pubkey)
      .slice(0, 1000);

    const [metaAndValidators, secondsForGet] = await withTimer(
      async () => await validatorsRegistry.getValidators(pubkeys),
    );

    expect(secondsForGet).toBeLessThan(2);

    expect(metaAndValidators.validators.length).toBe(1000);
  });

  test('performance - 100k validators', async () => {
    stateValidators = createStateValidators(100_000);

    const [_, secondsForUpdate] = await withTimer(
      async () => await validatorsRegistry.update('finalized'),
    );

    expect(secondsForUpdate).toBeLessThan(10);

    const [metaAndValidators, secondsForGet] = await withTimer(
      async () => await validatorsRegistry.getValidators(),
    );

    expect(secondsForGet).toBeLessThan(5);

    expect(metaAndValidators.validators.length).toBe(100_000);
  });
});
