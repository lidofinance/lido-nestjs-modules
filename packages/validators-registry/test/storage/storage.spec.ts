import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  ConsensusDataInvalidError,
  ConsensusMeta,
  StorageModule,
  StorageServiceInterface,
  Validator,
  ValidatorStatus,
} from '../../src';
import { meta, metaNew } from '../fixtures/consensus-meta.fixture';
import {
  validatorA,
  validatorB,
  validatorC,
  validatorD,
  validators,
} from '../fixtures/validators.fixture';
import { migrations } from '../helpers/migrations';
import { noop } from '../helpers/noop';

describe('Storage', () => {
  let storageService: StorageServiceInterface;
  let moduleRef: TestingModule | null = null;

  beforeEach(async () => {
    const imports = [
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
      StorageModule.forFeature(),
    ];

    moduleRef = await Test.createTestingModule({ imports }).compile();
    await moduleRef.init();
    storageService = moduleRef.get<StorageServiceInterface>(
      StorageServiceInterface,
    );

    // migrating when starting ORM
    await moduleRef.get(MikroORM).getMigrator().up();
  });

  afterEach(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();
  });

  afterAll(async () => {
    // this will call all destroy hooks for all modules
    await moduleRef?.close();
  });

  test('getValidators', async () => {
    await storageService.updateValidatorsAndMeta(validators, meta);

    await expect(storageService.getValidators()).resolves.toEqual([
      validators[0],
      validators[1],
    ]);
  });

  test('getValidators - empty array when empty', async () => {
    await expect(storageService.getValidators()).resolves.toEqual([]);
  });

  test('getValidators - same data double write', async () => {
    await storageService.updateValidatorsAndMeta(validators, meta);
    await storageService.updateValidatorsAndMeta(validators, meta);

    await expect(storageService.getValidators()).resolves.toEqual([
      validators[0],
      validators[1],
    ]);
  });

  test('getValidators - validators should append on update', async () => {
    const validatorsAB = [validatorA, validatorB];
    const validatorsABC = [validatorA, validatorB, validatorC];

    await storageService.updateValidatorsAndMeta(validatorsAB, meta);
    await storageService.updateValidatorsAndMeta(validatorsABC, meta);

    await expect(storageService.getValidators()).resolves.toEqual([
      validatorA,
      validatorB,
      validatorC,
    ]);
  });

  test('getValidators - validators should append and merge on update', async () => {
    const validatorsAB = [validatorA, validatorB];

    const validatorBChanged = {
      ...validatorB,
      status: ValidatorStatus.EXITED_UNSLASHED,
    };

    const validatorsABC = [validatorA, validatorBChanged, validatorC];

    await storageService.updateValidatorsAndMeta(validatorsAB, meta);
    await storageService.updateValidatorsAndMeta(validatorsABC, meta);

    await expect(storageService.getValidators()).resolves.toEqual([
      validatorA,
      validatorBChanged,
      validatorC,
    ]);
  });

  test('getValidators - filter by pubkey (lowercase)', async () => {
    const validatorsAB = [validatorA, validatorB];
    const validatorsCD = [validatorC, validatorD];

    await storageService.updateValidatorsAndMeta(validatorsAB, meta);
    await storageService.updateValidatorsAndMeta(validatorsCD, meta);

    await expect(
      storageService.getValidators([validatorC.pubkey]),
    ).resolves.toEqual([validatorC]);
  });

  test('getValidators - filter by pubkey (uppercase)', async () => {
    const validatorsAB = [validatorA, validatorB];
    const validatorsCD = [validatorC, validatorD];

    await storageService.updateValidatorsAndMeta(validatorsAB, meta);
    await storageService.updateValidatorsAndMeta(validatorsCD, meta);

    await expect(
      storageService.getValidators([validatorC.pubkey.toLocaleUpperCase()]),
    ).resolves.toEqual([validatorC]);
  });

  test('getValidators - filter by pubkey (lowercase) + filter by index + orderBy', async () => {
    const validatorsAB = [validatorA, validatorB];
    const validatorsABCD = [validatorA, validatorB, validatorC, validatorD];

    await storageService.updateValidatorsAndMeta(validatorsAB, meta);
    await storageService.updateValidatorsAndMeta(validatorsABCD, meta);

    await expect(
      storageService.getValidators(
        [validatorA.pubkey, validatorB.pubkey, validatorC.pubkey],
        {
          index: {
            $in: [validatorA.index, validatorC.index],
          },
        },
        {
          orderBy: { index: 'DESC' },
        },
      ),
    ).resolves.toEqual([validatorC, validatorA]);
  });

  test('getConsensusMeta', async () => {
    await storageService.updateValidatorsAndMeta(validators, meta);

    await expect(storageService.getConsensusMeta()).resolves.toEqual(meta);
  });

  test('getConsensusMeta - null when empty', async () => {
    await expect(storageService.getConsensusMeta()).resolves.toEqual(null);
  });

  test('getConsensusMeta - same data double write', async () => {
    await storageService.updateValidatorsAndMeta(validators, meta);
    await storageService.updateValidatorsAndMeta(validators, meta);
    await expect(storageService.getConsensusMeta()).resolves.toEqual(meta);
  });

  test('getConsensusMeta - latest write is a truth', async () => {
    await storageService.updateValidatorsAndMeta(validators, meta);
    await expect(storageService.getConsensusMeta()).resolves.toEqual(meta);

    await storageService.updateValidatorsAndMeta(validators, metaNew);
    await expect(storageService.getConsensusMeta()).resolves.toEqual(metaNew);
  });

  test('getValidatorsAndMeta', async () => {
    await storageService.updateValidatorsAndMeta(validators, meta);

    await expect(storageService.getValidatorsAndMeta()).resolves.toEqual({
      validators,
      meta,
    });
  });

  test('getValidatorsAndMeta - null when empty ', async () => {
    await expect(storageService.getValidatorsAndMeta()).resolves.toEqual({
      validators: [],
      meta: null,
    });
  });

  test('updateValidatorsAndMeta should not fail on correct args', async () => {
    await storageService.updateValidatorsAndMeta(validators, meta);
  });

  test('updateValidatorsAndMeta should allow to write empty validators', async () => {
    await storageService.updateValidatorsAndMeta([], meta);
  });

  test('updateValidatorsAndMeta should fail on bad meta', async () => {
    const badMeta: ConsensusMeta = {
      epoch: 23,
      slot: 1000,
      slotStateRoot: '0x01',
      blockNumber: 1000,
      blockHash: '0x01',
      timestamp: 1000,
    };

    await expect(
      storageService.updateValidatorsAndMeta(validators, badMeta),
    ).rejects.toBeInstanceOf(ConsensusDataInvalidError);
  });

  test('updateValidatorsAndMeta should fail on bad validators', async () => {
    const badValidator: Validator = {
      index: 1,
      status: ValidatorStatus.ACTIVE_ONGOING,
      pubkey: '0x01',
    };

    await expect(
      storageService.updateValidatorsAndMeta([badValidator], meta),
    ).rejects.toBeInstanceOf(ConsensusDataInvalidError);
  });

  test('updateValidatorsAndMeta should not fail on correct raw validator data', async () => {
    const rawValidatorData: unknown = [
      {
        index: '312312',
        status: 'withdrawal_possible',
        pubkey:
          '0x81fdd2dd6af7ba125713c352216e2a7b9953f3505e8ffce1f498d5981531e1009e0227bab8fdbe08f337e79ca8dc0c94',
      },
      {
        index: '312311',
        status: 'active_ongoing',
        pubkey:
          '0x8BD69E4F185B8127C39314F990A0D339878AD796DCA264F2FF6CFE4D332A4DED3FAFDA493B2588D1868C75E25BBCCDFA',
      },
    ];

    await storageService.updateValidatorsAndMeta(
      <Validator[]>rawValidatorData,
      meta,
    );
  });
});
