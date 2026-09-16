/* eslint-disable @typescript-eslint/no-explicit-any */
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ConsensusModule, ConsensusService } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { Readable } from 'stream';
import {
  ConsensusDataInvalidError,
  ExecutionPayloadNotFoundError,
  StorageModule,
  ValidatorsRegistry,
  ValidatorsRegistryInterface,
  ValidatorsRegistryModule,
  VALIDATORS_REGISTRY_DEFAULT_PAYLOAD_LOOKBACK_DEPTH,
} from '../src';
import { migrations } from './helpers/migrations';
import { noop } from './helpers/noop';
import {
  elHashE1,
  elHashE4,
  gloasBlocks,
  gloasEnvelopes,
  gloasHeaders,
  gloasStateValidators,
  metaG0,
  metaG1,
  metaG2,
  metaG3,
  metaG5,
  rootG1,
  rootG2,
  slotG0,
  slotG1,
  slotG2,
  slotG3,
  slotG4,
  slotG5,
} from './fixtures/gloas';

describe('ValidatorsRegistry (Gloas)', () => {
  let moduleRef: TestingModule | null = null;
  let validatorsRegistry: ValidatorsRegistryInterface;

  const consensusServiceMock = {
    getBlockV2: (args: { blockId: string }) => gloasBlocks[args.blockId],
    getBlockHeader: (args: { blockId: string }) => gloasHeaders[args.blockId],
    getSignedExecutionPayloadEnvelope: (args: { blockId: string }) =>
      gloasEnvelopes[args.blockId],
    getStateValidators: (args: { stateId: string }) =>
      gloasStateValidators[args.stateId],
    getStateValidatorsStream: (args: { stateId: string }) =>
      Readable.from(JSON.stringify(gloasStateValidators[args.stateId])),
  };

  const setup = async (payloadLookbackDepth?: number) => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConsensusModule.forRoot({ imports: [FetchModule] }),
        MikroOrmModule.forRoot({
          dbName: ':memory:',
          type: 'sqlite',
          allowGlobalContext: true,
          entities: [...StorageModule.entities],
          migrations: { migrationsList: migrations },
          logger: noop,
        }),
        ValidatorsRegistryModule.forFeature({ payloadLookbackDepth }),
      ],
    })
      .overrideProvider(ConsensusService)
      .useValue(consensusServiceMock)
      .compile();

    await moduleRef.init();
    validatorsRegistry = moduleRef.get<ValidatorsRegistryInterface>(
      ValidatorsRegistryInterface,
    );

    await moduleRef.get(MikroORM).getMigrator().up();
  };

  beforeEach(async () => {
    await setup();
  });

  afterEach(async () => {
    await moduleRef?.close();
    jest.clearAllMocks();
  });

  test('update, block before the fork keeps its inline payload', async () => {
    await expect(validatorsRegistry.update(slotG0)).resolves.toStrictEqual(
      metaG0,
    );
    await expect(validatorsRegistry.getMeta()).resolves.toStrictEqual(metaG0);
  });

  test('update, first block of the fork stands on the inline payload of its parent', async () => {
    await expect(validatorsRegistry.update(slotG1)).resolves.toStrictEqual(
      metaG1,
    );
    await expect(validatorsRegistry.getMeta()).resolves.toStrictEqual(metaG1);
  });

  test('update, payload of the parent was revealed', async () => {
    await expect(validatorsRegistry.update(slotG2)).resolves.toStrictEqual(
      metaG2,
    );
    await expect(validatorsRegistry.getMeta()).resolves.toStrictEqual(metaG2);
  });

  test('update, payload of the parent was skipped', async () => {
    await expect(validatorsRegistry.update(slotG3)).resolves.toStrictEqual(
      metaG3,
    );
    await expect(validatorsRegistry.getMeta()).resolves.toStrictEqual(metaG3);
  });

  test('update, chain catches up after a skipped payload', async () => {
    await expect(validatorsRegistry.update(slotG5)).resolves.toStrictEqual(
      metaG5,
    );
    await expect(validatorsRegistry.getMeta()).resolves.toStrictEqual(metaG5);
  });

  test('update, execution layer data repeats while the slot moves on', async () => {
    // The first block of the fork stands on the payload of the block before it, and a skipped
    // payload leaves the next block on an older one. Both give two slots the same execution
    // layer block, which is what the README says a reader has to be ready for.
    const run = async (slot: string) => await validatorsRegistry.update(slot);

    expect((await run(slotG0)).blockNumber).toBe(
      (await run(slotG1)).blockNumber,
    );
    expect((await run(slotG2)).blockNumber).toBe(
      (await run(slotG3)).blockNumber,
    );
    expect((await run(slotG5)).blockNumber).toBeGreaterThan(metaG3.blockNumber);
  });

  test('updateStream, payload of the parent was revealed', async () => {
    await expect(
      validatorsRegistry.updateStream(slotG2),
    ).resolves.toStrictEqual(metaG2);
    await expect(validatorsRegistry.getMeta()).resolves.toStrictEqual(metaG2);
  });

  test('update, applied payload belongs to none of the ancestors', async () => {
    await moduleRef?.close();
    // Four steps back walk the whole chain, and no block of it holds the payload the bid names
    await setup(4);

    await expect(validatorsRegistry.update(slotG4)).rejects.toStrictEqual(
      new ExecutionPayloadNotFoundError(
        `Execution payload [${elHashE4}] applied to the state is not found ` +
          `within [4] blocks back`,
        elHashE4,
        4,
      ),
    );
  });

  test('update, lookback depth of the module options is respected', async () => {
    await moduleRef?.close();
    // One step back only reaches the parent, whose payload was skipped
    await setup(1);

    await expect(validatorsRegistry.update(slotG3)).rejects.toBeInstanceOf(
      ExecutionPayloadNotFoundError,
    );
    // The parent is enough when its payload was revealed
    await expect(validatorsRegistry.update(slotG2)).resolves.toStrictEqual(
      metaG2,
    );
  });

  test('update, block holds no body', async () => {
    jest
      .spyOn<any, any>(consensusServiceMock, 'getBlockV2')
      .mockImplementationOnce(() => ({ data: {} }));

    await expect(validatorsRegistry.update(slotG2)).rejects.toStrictEqual(
      new ConsensusDataInvalidError(`No body data in a block`),
    );
  });

  test('update, node does not know a block of the walk', async () => {
    jest
      .spyOn<any, any>(consensusServiceMock, 'getBlockV2')
      .mockImplementationOnce((args: any) => gloasBlocks[args.blockId])
      .mockImplementationOnce(() => undefined);

    await expect(validatorsRegistry.update(slotG2)).rejects.toStrictEqual(
      new ConsensusDataInvalidError(`No body data in a block [${rootG1}]`),
    );
  });

  test('update, walk steps over a block that names no execution block', async () => {
    const blockG2WithoutBid: any = {
      data: {
        message: {
          ...(gloasBlocks[rootG2] as any).data.message,
          body: { signed_execution_payload_bid: null },
        },
      },
    };

    jest
      .spyOn<any, any>(consensusServiceMock, 'getBlockV2')
      .mockImplementationOnce((args: any) => gloasBlocks[args.blockId])
      .mockImplementationOnce(() => blockG2WithoutBid);

    // The walk finds nothing at G2 and keeps going to G1, which holds the payload the state has
    await expect(validatorsRegistry.update(slotG3)).resolves.toStrictEqual(
      metaG3,
    );
  });

  test('update, envelope holds no payload', async () => {
    const emptyAnswers = [
      undefined,
      {},
      { data: {} },
      { data: { message: {} } },
    ];

    for (const answer of emptyAnswers) {
      jest
        .spyOn<any, any>(
          consensusServiceMock,
          'getSignedExecutionPayloadEnvelope',
        )
        .mockImplementationOnce(() => answer);

      await expect(validatorsRegistry.update(slotG2)).rejects.toStrictEqual(
        new ConsensusDataInvalidError(
          `No execution payload in the envelope of a block [${rootG1}]`,
        ),
      );
    }
  });

  test('update, node has no envelope for the block', async () => {
    jest
      .spyOn<any, any>(
        consensusServiceMock,
        'getSignedExecutionPayloadEnvelope',
      )
      .mockImplementationOnce(() => {
        throw new HttpException('Execution payload envelope not found', 404);
      });

    await expect(validatorsRegistry.update(slotG2)).rejects.toStrictEqual(
      new ExecutionPayloadNotFoundError(
        `Node has no execution payload envelope for a block [${rootG1}], ` +
          `which holds execution payload [${elHashE1}] applied to the state`,
        elHashE1,
      ),
    );
  });

  test('update, envelope request fails for another reason', async () => {
    const failure = new HttpException('Server error', 500);

    jest
      .spyOn<any, any>(
        consensusServiceMock,
        'getSignedExecutionPayloadEnvelope',
      )
      .mockImplementationOnce(() => {
        throw failure;
      });

    // A timeout or a 500 says nothing about the payload, so it is left as it is
    await expect(validatorsRegistry.update(slotG2)).rejects.toBe(failure);
  });

  test('update, envelope holds the payload of another block', async () => {
    const envelope: any = gloasEnvelopes[rootG1];

    jest
      .spyOn<any, any>(
        consensusServiceMock,
        'getSignedExecutionPayloadEnvelope',
      )
      .mockImplementationOnce(() => ({
        data: {
          message: {
            payload: { ...envelope.data.message.payload, block_hash: '0xdead' },
          },
        },
      }));

    await expect(validatorsRegistry.update(slotG2)).rejects.toBeInstanceOf(
      ConsensusDataInvalidError,
    );
  });

  test('payloadLookbackDepth falls back to the default', () => {
    const registry = moduleRef?.get<ValidatorsRegistry>(
      ValidatorsRegistryInterface,
    );

    expect(registry?.payloadLookbackDepth).toBe(
      VALIDATORS_REGISTRY_DEFAULT_PAYLOAD_LOOKBACK_DEPTH,
    );

    // The options are optional, so the registry also works when nothing provides them at all
    const withoutOptions = new ValidatorsRegistry(
      consensusServiceMock as any,
      {} as any,
    );

    expect(withoutOptions.payloadLookbackDepth).toBe(
      VALIDATORS_REGISTRY_DEFAULT_PAYLOAD_LOOKBACK_DEPTH,
    );
  });
});
