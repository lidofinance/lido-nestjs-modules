import {
  CONSENSUS_FORKS,
  ConsensusFork,
  EXECUTION_PAYLOAD_BID_FORKS,
  EXECUTION_PAYLOAD_FORKS,
  ExecutionPayloadBidFork,
  ExecutionPayloadFork,
  VersionedSignedBeaconBlock,
} from '../interfaces/fork.interface';

/** True if `fork` is `since` or a later fork. */
export const isForkAtLeast = (
  fork: ConsensusFork,
  since: ConsensusFork,
): boolean => CONSENSUS_FORKS.indexOf(fork) >= CONSENSUS_FORKS.indexOf(since);

/** Narrows a block to the forks where the block body carries the execution payload. */
export const hasExecutionPayload = (
  block: VersionedSignedBeaconBlock,
): block is VersionedSignedBeaconBlock<ExecutionPayloadFork> =>
  (EXECUTION_PAYLOAD_FORKS as readonly string[]).includes(block.version);

/** Narrows a block to the forks where the block body carries a signed execution payload bid. */
export const hasExecutionPayloadBid = (
  block: VersionedSignedBeaconBlock,
): block is VersionedSignedBeaconBlock<ExecutionPayloadBidFork> =>
  (EXECUTION_PAYLOAD_BID_FORKS as readonly string[]).includes(block.version);
