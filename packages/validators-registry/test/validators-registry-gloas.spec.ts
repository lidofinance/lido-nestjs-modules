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
  elHashE0,
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
  rootG0,
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

  const clone = (answer: unknown): any => JSON.parse(JSON.stringify(answer));

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

  test('update, walk reaches the block before the fork in more than one step', async () => {
    // The builder of G1 was too late as well, so the state of G2 still has the inline payload of
    // G0: the walk steps over G1 and ends before the fork, two blocks back
    const blockG2OnE0 = clone(gloasBlocks[rootG2]);
    blockG2OnE0.data.message.body.signed_execution_payload_bid.message.parent_block_hash =
      elHashE0;

    const getBlock = jest
      .spyOn<any, any>(consensusServiceMock, 'getBlockV2')
      .mockImplementationOnce(() => blockG2OnE0);

    const envelopes = jest.spyOn<any, any>(
      consensusServiceMock,
      'getSignedExecutionPayloadEnvelope',
    );

    // The slot data of G2 with the execution layer data of G0
    const meta = {
      ...metaG2,
      timestamp: metaG0.timestamp,
      blockNumber: metaG0.blockNumber,
      blockHash: metaG0.blockHash,
      payloadSlot: Number(slotG0),
    };

    await expect(validatorsRegistry.update(slotG2)).resolves.toStrictEqual(
      meta,
    );
    await expect(validatorsRegistry.getMeta()).resolves.toStrictEqual(meta);

    // The walk went G2 -> G1 -> G0 and did not stop on the parent
    expect(
      getBlock.mock.calls.map(([args]: any) => args.blockId),
    ).toStrictEqual([rootG2, rootG1, rootG0]);

    // A block before the fork carries its payload, so no envelope is asked for
    expect(envelopes).not.toHaveBeenCalled();
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

  test('update, answers name one payload in three cases of hex', async () => {
    // Nothing makes a node answer in one case, and the fetch layer moves to the next base url on every retry, so the
    // three hashes the walk puts together here are the same payload written three ways
    const upper = (hex: string) => `0x${hex.slice(2).toUpperCase()}`;
    const mixed = (hex: string) => upper(hex.slice(0, 34)) + hex.slice(34);

    const blockG2 = clone(gloasBlocks[rootG2]);
    blockG2.data.message.body.signed_execution_payload_bid.message.parent_block_hash =
      mixed(elHashE1);

    const blockG1 = clone(gloasBlocks[rootG1]);
    blockG1.data.message.body.signed_execution_payload_bid.message.block_hash =
      upper(elHashE1);

    const envelope = clone(gloasEnvelopes[rootG1]);
    envelope.data.message.payload.block_hash = upper(elHashE1);

    jest
      .spyOn<any, any>(consensusServiceMock, 'getBlockV2')
      .mockImplementationOnce(() => blockG2)
      .mockImplementationOnce(() => blockG1);

    jest
      .spyOn<any, any>(
        consensusServiceMock,
        'getSignedExecutionPayloadEnvelope',
      )
      .mockImplementationOnce(() => envelope);

    await expect(validatorsRegistry.update(slotG2)).resolves.toStrictEqual(
      metaG2,
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
