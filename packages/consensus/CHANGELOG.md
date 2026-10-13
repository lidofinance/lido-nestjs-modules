# Changelog

## 2.0.0

Support for the Glamsterdam fork (consensus fork Gloas, EIP-7732). Types follow beacon-APIs `v5.0.0-beta.0` and consensus-specs `v1.7.0-beta`.

### Breaking changes

- `getBlockV2` and `getStateV2` return a union discriminated by `version`. Before, the type merged all forks, so a field of one fork type-checked on every fork and was `undefined` at runtime. Now it is a build error.
  - `ConsensusMethodResult<'getBlockV2'>` and `ConsensusMethodResult<'getStateV2'>` changed the same way, and so did the block passed to `subscribe`.
  - `data.message` of a block is no longer optional.
- Methods removed from beacon-APIs are gone: `getBlockAttestations`, `getPoolAttestations`, `submitPoolAttestations`, `getPoolAttesterSlashings`, `submitPoolAttesterSlashings`, `getAggregatedAttestation`, `publishAggregateAndProofs`, `publishBlock`, `publishBlindedBlock`. Use the `V2` methods.
- `producePayloadAttestationData` resolves to `null` when the node answers 204.

### Added

- Gloas reads: `getSignedExecutionPayloadEnvelope`, `getStateBuilders`, `getBuilderPendingPayments`, `getBuilderPendingWithdrawals`, `getStatePtc`, `getProposerPreferences`, `getPoolPayloadAttestations`, `getDebugForkChoiceV2`.
- Other reads: `getProposerLookahead`, `getProposerDutiesV2`, `getNodeVersionV2`, `producePayloadAttestationData`.
- Write methods as stubs that throw: `publishExecutionPayloadBid`, `publishExecutionPayloadEnvelope`, `submitPayloadAttestationMessages`, `produceBlockV4`, `getExecutionPayloadEnvelope`, `submitProposerPreferences`, `submitBuilderPreferences`, `getPtcDuties`.
- Guards `hasExecutionPayload` (bellatrix to fulu) and `hasExecutionPayloadBid` (gloas), and `isForkAtLeast(fork, since)`.
- Types and constants: `ConsensusFork`, `CONSENSUS_FORKS`, `EXECUTION_PAYLOAD_FORKS`, `EXECUTION_PAYLOAD_BID_FORKS`, `VersionedSignedBeaconBlock<F>`, `VersionedBeaconState<F>`, `SignedBeaconBlockByFork`, `BeaconStateByFork`.

### Fixed

- `getHealth` failed on every call, because the node answers with an empty body. It now resolves to `null` when the node is healthy.

### Deprecated

`getProposerDuties`, `getNodeVersion`, `produceBlockV3`, `publishBlindedBlockV2`, `prepareBeaconProposer`, `registerValidator`.

### Migration

1. Build your project. Each error on a block or state field is a place that reads a field not every fork has.
2. Narrow the response before the read:

   ```ts
   const block = await consensusService.getBlockV2({ blockId: 'finalized' });

   if (hasExecutionPayload(block)) {
     const { block_number, block_hash } =
       block.data.message.body.execution_payload;
   } else if (hasExecutionPayloadBid(block)) {
     const bid = block.data.message.body.signed_execution_payload_bid.message;
     // The payload is in getSignedExecutionPayloadEnvelope and may be missing.
   }
   ```

   Or switch on `block.version`. Keep a branch that throws for a fork you do not handle.

3. Gloas changes the meaning of data, not only its place:
   - A block may have no payload. Its payload is canonical only if the next block's `bid.parent_block_hash` equals its `bid.block_hash`.
   - The state of block N holds the payload of an earlier block: `state.latest_block_hash == bid.parent_block_hash`.
   - `latest_execution_payload_header` is gone from the state. Use `latest_block_hash` and `latest_execution_payload_bid`.
   - `bid.value` and `bid.execution_payment` are in Gwei.
4. If you call the envelope endpoint with a raw `fetch`, the path is `/eth/v1/beacon/execution_payload_envelopes/{block_id}` (plural).
5. Replace fork checks based on dates or config constants with `block.version`, for example `isForkAtLeast(block.version, 'gloas')`.
