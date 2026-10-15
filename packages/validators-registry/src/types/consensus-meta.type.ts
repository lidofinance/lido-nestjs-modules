import { z } from 'zod';
import {
  BlockNumber,
  BlockTimestamp,
  Epoch,
  Hash32Hex,
  RootHex,
  Slot,
} from './primitives';

export const ConsensusMeta = z.object(
  {
    // consensus layer data
    epoch: Epoch,
    slot: Slot,
    slotStateRoot: RootHex,
    /**
     * Timestamp of the execution payload, which is the time of `payloadSlot` and not of `slot`.
     *
     * The two are the same up to Fulu. Since Gloas (EIP-7732) this is at least one slot behind the slot it comes
     * with. Take the time of `slot` from the slot number itself when that is what is needed.
     */
    timestamp: BlockTimestamp,
    // execution layer data
    /**
     * Number of the execution layer block, which can be the same as in the meta before this one.
     *
     * Since Gloas (EIP-7732) a slot may add no execution layer block at all: that happens at the first slot of the
     * fork, and every time a builder does not reveal its payload in time. `slot` always moves forward, this field
     * does not.
     */
    blockNumber: BlockNumber,
    blockHash: Hash32Hex,
    /**
     * Slot whose execution payload the `blockNumber`, `blockHash` and `timestamp` fields describe.
     *
     * Up to Fulu a block carries its own payload, so this is always `slot` itself and the field is left out.
     *
     * Since Gloas (EIP-7732) the payload is revealed apart from the block, and the state of `slot` only has the
     * payload of an earlier block. That is normally the parent, so `payloadSlot` is normally the parent slot. It goes
     * further back when the payload of the parent was not revealed in time, and also when slots before `slot` were
     * missed: both leave the execution layer data older than the slot it is reported with.
     */
    payloadSlot: Slot.optional(),
  },
  { description: 'Consensus meta' },
);

export type ConsensusMeta = z.infer<typeof ConsensusMeta>;
