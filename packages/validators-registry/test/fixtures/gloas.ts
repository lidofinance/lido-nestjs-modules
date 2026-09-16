import { ConsensusMeta } from '../../src';

/**
 * A short chain around the Gloas (EIP-7732) fork.
 *
 * G0 is the last block before the fork: it carries its execution payload inline. Every block after it only commits to
 * a bid, and the payload is revealed in an envelope of its own.
 *
 *   G0 (pre-fork, payload E0 inline)
 *   G1 (bid: parent E0, own E1)   <- payload E1 revealed
 *   G2 (bid: parent E1, own E2)   <- payload E2 never revealed
 *   G3 (bid: parent E1, own E3)   <- built on E1, so the walk has to step over G2
 *   G4 (bid: parent E4)           <- names a payload no block of this chain has
 */

const fill = (byte: string) => `0x${byte.repeat(32)}`;

export const rootG0 = fill('a0');
export const rootG1 = fill('a1');
export const rootG2 = fill('a2');
export const rootG3 = fill('a3');
export const rootG4 = fill('a4');
export const rootBeforeG0 = fill('af');

export const stateRootG0 = fill('b0');
export const stateRootG1 = fill('b1');
export const stateRootG2 = fill('b2');
export const stateRootG3 = fill('b3');
export const stateRootG4 = fill('b4');

export const elHashE0 = fill('e0');
export const elHashE1 = fill('e1');
export const elHashE2 = fill('e2');
export const elHashE3 = fill('e3');
export const elHashE4 = fill('e4');

export const slotG0 = '4800000';
export const slotG1 = '4800001';
export const slotG2 = '4800002';
export const slotG3 = '4800003';
export const slotG4 = '4800004';

const commonBody = {
  randao_reveal: '0x00',
  eth1_data: {
    deposit_root: fill('11'),
    deposit_count: '195216',
    block_hash: fill('12'),
  },
  graffiti: fill('13'),
  proposer_slashings: [],
  attester_slashings: [],
  attestations: [],
  deposits: [],
  voluntary_exits: [],
  sync_aggregate: {
    sync_committee_bits: '0x01',
    sync_committee_signature: '0x00',
  },
};

const makeHeader = (root: string, slot: string, parentRoot: string) => ({
  execution_optimistic: false,
  data: {
    root,
    canonical: true,
    header: {
      message: {
        slot,
        proposer_index: '1',
        parent_root: parentRoot,
        state_root: fill('cc'),
        body_root: fill('dd'),
      },
      signature: '0x00',
    },
  },
});

const makeInlinePayload = (
  blockHash: string,
  blockNumber: string,
  timestamp: string,
) => ({
  parent_hash: fill('ff'),
  fee_recipient: '0x000095e79eac4d76aab57cb2c1f091d553b36ca0',
  state_root: fill('ee'),
  receipts_root: fill('dd'),
  logs_bloom: '0x00',
  prev_randao: fill('cc'),
  block_number: blockNumber,
  gas_limit: '30000000',
  gas_used: '7972101',
  timestamp,
  extra_data: '0x',
  base_fee_per_gas: '3778',
  block_hash: blockHash,
  transactions: [],
});

const makeBid = (parentBlockHash: string, blockHash: string) => ({
  message: {
    parent_block_hash: parentBlockHash,
    parent_block_root: fill('bb'),
    block_hash: blockHash,
    prev_randao: fill('cc'),
    fee_recipient: '0x000095e79eac4d76aab57cb2c1f091d553b36ca0',
    gas_limit: '30000000',
    builder_index: '7',
    slot: '0',
    value: '1',
    execution_payment: '0',
    blob_kzg_commitments: [],
    execution_requests_root: fill('aa'),
  },
  signature: '0x00',
});

/** Last block before the fork: the payload is a part of the block */
export const blockG0 = {
  version: 'fulu',
  execution_optimistic: false,
  data: {
    message: {
      slot: slotG0,
      proposer_index: '1',
      parent_root: rootBeforeG0,
      state_root: stateRootG0,
      body: {
        ...commonBody,
        execution_payload: makeInlinePayload(elHashE0, '8316773', '1673803488'),
      },
    },
    signature: '0x00',
  },
};

const makeGloasBlock = (
  slot: string,
  parentRoot: string,
  stateRoot: string,
  parentBlockHash: string,
  blockHash: string,
) => ({
  version: 'gloas',
  execution_optimistic: false,
  data: {
    message: {
      slot,
      proposer_index: '1',
      parent_root: parentRoot,
      state_root: stateRoot,
      body: {
        ...commonBody,
        signed_execution_payload_bid: makeBid(parentBlockHash, blockHash),
        payload_attestations: [],
      },
    },
    signature: '0x00',
  },
});

/** First block of the fork: the payload it stands on is the inline one of its pre-fork parent */
export const blockG1 = makeGloasBlock(
  slotG1,
  rootG0,
  stateRootG1,
  elHashE0,
  elHashE1,
);

/** The payload of G1 was revealed in time, so the state of G2 has it */
export const blockG2 = makeGloasBlock(
  slotG2,
  rootG1,
  stateRootG2,
  elHashE1,
  elHashE2,
);

/** The payload of G2 was not revealed, so G3 still stands on the payload of G1 */
export const blockG3 = makeGloasBlock(
  slotG3,
  rootG2,
  stateRootG3,
  elHashE1,
  elHashE3,
);

/** Names a payload that belongs to no block of this chain */
export const blockG4 = makeGloasBlock(
  slotG4,
  rootG3,
  stateRootG4,
  elHashE4,
  fill('e5'),
);

const makeEnvelope = (
  blockHash: string,
  blockNumber: string,
  timestamp: string,
) => ({
  version: 'gloas',
  execution_optimistic: false,
  finalized: true,
  data: {
    message: {
      payload: makeInlinePayload(blockHash, blockNumber, timestamp),
      execution_requests: {},
      builder_index: '7',
      beacon_block_root: fill('bb'),
      parent_beacon_block_root: fill('bc'),
    },
    signature: '0x00',
  },
});

export const envelopeG1 = makeEnvelope(elHashE1, '8316774', '1673803500');

export const headerG0 = makeHeader(rootG0, slotG0, rootBeforeG0);
export const headerG1 = makeHeader(rootG1, slotG1, rootG0);
export const headerG2 = makeHeader(rootG2, slotG2, rootG1);
export const headerG3 = makeHeader(rootG3, slotG3, rootG2);
export const headerG4 = makeHeader(rootG4, slotG4, rootG3);

export const gloasHeaders: Record<string, unknown> = {
  [slotG0]: headerG0,
  [slotG1]: headerG1,
  [slotG2]: headerG2,
  [slotG3]: headerG3,
  [slotG4]: headerG4,
};

export const gloasBlocks: Record<string, unknown> = {
  [rootG0]: blockG0,
  [rootG1]: blockG1,
  [rootG2]: blockG2,
  [rootG3]: blockG3,
  [rootG4]: blockG4,
};

export const gloasEnvelopes: Record<string, unknown> = {
  [rootG1]: envelopeG1,
};

const stateValidatorsResponse = {
  execution_optimistic: false,
  data: [
    {
      index: '1',
      balance: '34006594880',
      status: 'active_ongoing',
      validator: {
        pubkey:
          '0xaffc434cf8138634a4cd0ef6cb815febd3db25760b1b6c522f9b4aa78e599b60336d7dd2e953192e45d4ac91f66f0723',
        withdrawal_credentials: fill('00'),
        effective_balance: '32000000000',
        slashed: false,
        activation_eligibility_epoch: '0',
        activation_epoch: '0',
        exit_epoch: '18446744073709551615',
        withdrawable_epoch: '18446744073709551615',
      },
    },
  ],
};

export const gloasStateValidators: Record<string, unknown> = {
  [stateRootG0]: stateValidatorsResponse,
  [stateRootG1]: stateValidatorsResponse,
  [stateRootG2]: stateValidatorsResponse,
  [stateRootG3]: stateValidatorsResponse,
  [stateRootG4]: stateValidatorsResponse,
};

/** The block before the fork keeps the meta it always had, with no payload slot of its own */
export const metaG0: ConsensusMeta = {
  epoch: Math.floor(Number(slotG0) / 32),
  slot: Number(slotG0),
  slotStateRoot: stateRootG0,
  timestamp: 1673803488,
  blockNumber: 8316773,
  blockHash: elHashE0,
};

/** The first block of the fork stands on the inline payload of its pre-fork parent */
export const metaG1: ConsensusMeta = {
  epoch: Math.floor(Number(slotG1) / 32),
  slot: Number(slotG1),
  slotStateRoot: stateRootG1,
  timestamp: 1673803488,
  blockNumber: 8316773,
  blockHash: elHashE0,
  payloadSlot: Number(slotG0),
};

/** The payload of the parent was revealed, so the envelope of the parent answers */
export const metaG2: ConsensusMeta = {
  epoch: Math.floor(Number(slotG2) / 32),
  slot: Number(slotG2),
  slotStateRoot: stateRootG2,
  timestamp: 1673803500,
  blockNumber: 8316774,
  blockHash: elHashE1,
  payloadSlot: Number(slotG1),
};

/** The payload of the parent was skipped, so the answer comes from one block further back */
export const metaG3: ConsensusMeta = {
  epoch: Math.floor(Number(slotG3) / 32),
  slot: Number(slotG3),
  slotStateRoot: stateRootG3,
  timestamp: 1673803500,
  blockNumber: 8316774,
  blockHash: elHashE1,
  payloadSlot: Number(slotG1),
};
