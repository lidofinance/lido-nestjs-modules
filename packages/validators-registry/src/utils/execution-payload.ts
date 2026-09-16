import { ConsensusMethodResult } from '@lido-nestjs/consensus';

type BlockResponse = Awaited<ConsensusMethodResult<'getBlockV2'>>;
type EnvelopeResponse = Awaited<
  ConsensusMethodResult<'getSignedExecutionPayloadEnvelope'>
>;

export type BeaconBlockMessage = NonNullable<BlockResponse['data']['message']>;
export type BeaconBlockBody = NonNullable<BeaconBlockMessage['body']>;

/**
 * Fields of an execution payload the registry keeps, plus the slot the payload belongs to.
 */
export interface AppliedExecutionPayload {
  blockNumber: unknown;
  blockHash: unknown;
  timestamp: unknown;
  payloadSlot?: unknown;
}

/**
 * The execution payload the block carries itself, `undefined` since Gloas (EIP-7732).
 *
 * Up to Fulu the payload is a field of the block body, so it is applied to the state within the same slot.
 */
export const getInlineExecutionPayload = (body: BeaconBlockBody) => {
  return 'execution_payload' in body ? body.execution_payload : undefined;
};

/**
 * The bid the block commits to, `undefined` up to Fulu.
 *
 * [New in Gloas:EIP7732] The proposer no longer carries a payload. It picks a bid from a builder instead, and the
 * builder reveals the payload later in the slot, in an envelope of its own.
 */
export const getExecutionPayloadBid = (body: BeaconBlockBody) => {
  return 'signed_execution_payload_bid' in body
    ? body.signed_execution_payload_bid?.message
    : undefined;
};

/**
 * Hash of the execution layer block the state of this block already has.
 *
 * `process_execution_payload_bid` asserts `bid.parent_block_hash == state.latest_block_hash`, so the bid names it for
 * free. That is the payload of the latest ancestor whose own payload was revealed in time, which is normally the
 * parent and goes further back when a builder missed its turn.
 */
export const getAppliedExecutionBlockHash = (
  body: BeaconBlockBody,
): string | undefined => {
  return getExecutionPayloadBid(body)?.parent_block_hash;
};

/**
 * Hash of the execution layer block this block stands for, whichever fork it belongs to.
 *
 * Up to Fulu it is the hash of the payload the block carries. Since Gloas (EIP-7732) it is the hash the builder
 * promised in the bid, and only the next block tells whether the builder kept the promise.
 */
export const getOwnExecutionBlockHash = (
  body: BeaconBlockBody,
): string | undefined => {
  return (
    getInlineExecutionPayload(body)?.block_hash ??
    getExecutionPayloadBid(body)?.block_hash
  );
};

/**
 * Payload of the envelope the builder revealed for a block, `undefined` when the answer holds no payload.
 */
export const getEnvelopePayload = (envelope: EnvelopeResponse | undefined) => {
  return envelope?.data?.message?.payload;
};
