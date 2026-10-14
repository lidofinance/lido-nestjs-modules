/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  ConsensusService,
  ConsensusSubscribeBlock,
  VersionedSignedBeaconBlock,
  hasExecutionPayload,
  hasExecutionPayloadBid,
} from '../src';
import { ConsensusMethodResult } from '../src/interfaces/consensus.interface';

type BlockResult = Awaited<ConsensusMethodResult<'getBlockV2'>>;
type StateResult = Awaited<ConsensusMethodResult<'getStateV2'>>;
type BlockMethodResult = Awaited<ReturnType<ConsensusService['getBlockV2']>>;
type StateMethodResult = Awaited<ReturnType<ConsensusService['getStateV2']>>;

const blockHash = (block: BlockResult): string | null => {
  // @ts-expect-error execution_payload is not in the block body of every fork
  block.data.message.body.execution_payload;
  // @ts-expect-error the bid is not in the block body of every fork
  block.data.message.body.signed_execution_payload_bid;

  if (hasExecutionPayload(block)) {
    return block.data.message.body.execution_payload.block_hash;
  }
  if (hasExecutionPayloadBid(block)) {
    // @ts-expect-error a Gloas block body has no execution_payload
    block.data.message.body.execution_payload;
    return block.data.message.body.signed_execution_payload_bid.message
      .block_hash;
  }
  return null;
};

const blockHashByVersion = (block: BlockMethodResult): string | null => {
  // @ts-expect-error execution_payload is not in the block body of every fork
  block.data.message.body.execution_payload;
  // @ts-expect-error the bid is not in the block body of every fork
  block.data.message.body.signed_execution_payload_bid;

  switch (block.version) {
    case 'phase0':
    case 'altair':
      return null;
    case 'gloas':
      return block.data.message.body.signed_execution_payload_bid.message
        .block_hash;
    default:
      return block.data.message.body.execution_payload.block_hash;
  }
};

const latestPayloadHash = (state: StateResult): string | null => {
  // @ts-expect-error not in the state of every fork
  state.data.latest_execution_payload_header;

  if (state.version === 'gloas') {
    // @ts-expect-error removed from the Gloas state
    state.data.latest_execution_payload_header;
    return state.data.latest_block_hash;
  }
  if (state.version === 'fulu') {
    return state.data.latest_execution_payload_header.block_hash;
  }
  return null;
};

const latestBlockHash = (state: StateMethodResult): string | null => {
  // @ts-expect-error not in the state of every fork
  state.data.latest_block_hash;

  return state.version === 'gloas' ? state.data.latest_block_hash : null;
};

const subscribedBlockSlot = (block: ConsensusSubscribeBlock) => {
  // @ts-expect-error execution_payload is not in the block body of every fork
  block?.message.body.execution_payload;
  return block?.message.slot;
};

const fuluBlock = {
  version: 'fulu',
  data: {
    message: { slot: '1', body: { execution_payload: { block_hash: '0xa' } } },
  },
} as unknown as VersionedSignedBeaconBlock;

const gloasBlock = {
  version: 'gloas',
  data: {
    message: {
      slot: '2',
      body: {
        signed_execution_payload_bid: { message: { block_hash: '0xb' } },
      },
    },
  },
} as unknown as VersionedSignedBeaconBlock;

const phase0Block = {
  version: 'phase0',
  data: { message: { slot: '0', body: {} } },
} as unknown as VersionedSignedBeaconBlock;

describe('Fork types', () => {
  test('blocks narrow by guard and by version', () => {
    // Property reads marked with @ts-expect-error run too and give undefined.
    expect(blockHash(fuluBlock)).toBe('0xa');
    expect(blockHash(gloasBlock)).toBe('0xb');
    expect(blockHash(phase0Block)).toBeNull();
    expect(blockHashByVersion(fuluBlock)).toBe('0xa');
    expect(blockHashByVersion(gloasBlock)).toBe('0xb');
    expect(blockHashByVersion(phase0Block)).toBeNull();
    expect(subscribedBlockSlot(gloasBlock.data)).toBe('2');
  });

  test('states narrow by version', () => {
    const gloasState = {
      version: 'gloas',
      data: { latest_block_hash: '0xc' },
    } as unknown as StateResult;
    const fuluState = {
      version: 'fulu',
      data: { latest_execution_payload_header: { block_hash: '0xd' } },
    } as unknown as StateResult;
    const phase0State = { version: 'phase0', data: {} } as StateResult;

    expect(latestPayloadHash(gloasState)).toBe('0xc');
    expect(latestPayloadHash(fuluState)).toBe('0xd');
    expect(latestPayloadHash(phase0State)).toBeNull();
    expect(latestBlockHash(gloasState)).toBe('0xc');
    expect(latestBlockHash(fuluState)).toBeNull();
  });
});
