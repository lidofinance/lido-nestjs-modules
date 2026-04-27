import {
  ConsensusMethodArgs,
  ConsensusMethodResult,
} from '../interfaces/consensus.interface';
import { ConsensusBaseService } from './base.service';

export class ConsensusBeaconService extends ConsensusBaseService {
  /** Retrieve details of the chain's genesis which can be used to identify chain. */
  public async getGenesis(
    args?: ConsensusMethodArgs<'getGenesis'>,
  ): ConsensusMethodResult<'getGenesis'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/beacon/genesis`, options);
  }

  /** Calculates HashTreeRoot for state with given 'stateId'. If stateId is root, same value will be returned. */
  public async getStateRoot(
    args: ConsensusMethodArgs<'getStateRoot'>,
  ): ConsensusMethodResult<'getStateRoot'> {
    const { stateId, options } = args;
    return await this.fetch(`/eth/v1/beacon/states/${stateId}/root`, options);
  }

  /** Returns Fork object for state with given 'stateId'. */
  public async getStateFork(
    args: ConsensusMethodArgs<'getStateFork'>,
  ): ConsensusMethodResult<'getStateFork'> {
    const { stateId, options } = args;
    return await this.fetch(`/eth/v1/beacon/states/${stateId}/fork`, options);
  }

  /**
   * Returns finality checkpoints for state with given 'stateId'.
   * In case finality is not yet achieved, checkpoint should return epoch 0 and ZERO_HASH as root.
   */
  public async getStateFinalityCheckpoints(
    args: ConsensusMethodArgs<'getStateFinalityCheckpoints'>,
  ): ConsensusMethodResult<'getStateFinalityCheckpoints'> {
    const { stateId, options } = args;
    return await this.fetch(
      `/eth/v1/beacon/states/${stateId}/finality_checkpoints`,
      options,
    );
  }

  /** Returns filterable list of validators with their balance, status and index. */
  public async getStateValidators(
    args: ConsensusMethodArgs<'getStateValidators'>,
  ): ConsensusMethodResult<'getStateValidators'> {
    const { stateId, id, status, options } = args;
    const search = this.getSearchString({ id, status });
    return await this.fetch(
      `/eth/v1/beacon/states/${stateId}/validators${search}`,
      options,
    );
  }

  /**
   * Returns filterable list of validators with their balance, status and index.
   * POST variant allows passing large lists of IDs and statuses via request body.
   */
  public async postStateValidators(
    args: ConsensusMethodArgs<'postStateValidators'>,
  ): ConsensusMethodResult<'postStateValidators'> {
    const { stateId, ids, statuses, options } = args;
    return await this.fetch(`/eth/v1/beacon/states/${stateId}/validators`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify({ ids, statuses }),
    });
  }

  /** Returns filterable stream of validators with their balance, status and index. */
  public async getStateValidatorsStream(
    args: ConsensusMethodArgs<'getStateValidators'>,
  ): Promise<NodeJS.ReadableStream> {
    const { stateId, id, status, options } = args;
    const search = this.getSearchString({ id, status });
    return await this.fetchStream(
      `/eth/v1/beacon/states/${stateId}/validators${search}`,
      options,
    );
  }

  /** Returns validator specified by state and id or public key along with status and balance. */
  public async getStateValidator(
    args: ConsensusMethodArgs<'getStateValidator'>,
  ): ConsensusMethodResult<'getStateValidator'> {
    const { stateId, validatorId, options } = args;
    return await this.fetch(
      `/eth/v1/beacon/states/${stateId}/validators/${validatorId}`,
      options,
    );
  }

  /** Returns filterable list of validators balances. */
  public async getStateValidatorBalances(
    args: ConsensusMethodArgs<'getStateValidatorBalances'>,
  ): ConsensusMethodResult<'getStateValidatorBalances'> {
    const { stateId, id, options } = args;
    const search = this.getSearchString({ id });
    return await this.fetch(
      `/eth/v1/beacon/states/${stateId}/validator_balances${search}`,
      options,
    );
  }

  /** Retrieves the committees for the given state. */
  public async getEpochCommittees(
    args: ConsensusMethodArgs<'getEpochCommittees'>,
  ): ConsensusMethodResult<'getEpochCommittees'> {
    const { stateId, epoch, index, slot, options } = args;
    const search = this.getSearchString({ epoch, index, slot });
    return await this.fetch(
      `/eth/v1/beacon/states/${stateId}/committees${search}`,
      options,
    );
  }

  /** Retrieves the sync committees for the given state. */
  public async getEpochSyncCommittees(
    args: ConsensusMethodArgs<'getEpochSyncCommittees'>,
  ): ConsensusMethodResult<'getEpochSyncCommittees'> {
    const { stateId, epoch, options } = args;
    const search = this.getSearchString({ epoch });
    return await this.fetch(
      `/eth/v1/beacon/states/${stateId}/sync_committees${search}`,
      options,
    );
  }

  /** Retrieves block headers matching given query. By default it will fetch current head slot blocks. */
  public async getBlockHeaders(
    args?: ConsensusMethodArgs<'getBlockHeaders'>,
  ): ConsensusMethodResult<'getBlockHeaders'> {
    const { options, slot, parentRoot } = args || {};
    const search = this.getSearchString({ slot, parentRoot });
    return await this.fetch(`/eth/v1/beacon/headers${search}`, options);
  }

  /** Retrieves block header for given block id. */
  public async getBlockHeader(
    args: ConsensusMethodArgs<'getBlockHeader'>,
  ): ConsensusMethodResult<'getBlockHeader'> {
    const { blockId, options } = args;
    return await this.fetch(`/eth/v1/beacon/headers/${blockId}`, options);
  }

  /**
   * Instructs the beacon node to broadcast a newly signed beacon block to the beacon network,
   * to be included in the beacon chain. Versioned variant introduced in beacon-APIs v3
   * which mandates the `Eth-Consensus-Version` header on submission.
   */
  public async publishBlockV2(): ConsensusMethodResult<'publishBlockV2'> {
    throw new Error('Method is not implemented');
  }

  /**
   * Instructs the beacon node to use the components of the `SignedBlindedBeaconBlock` to construct and publish a
   * `SignedBeaconBlock` by swapping out the `transactions_root` for the corresponding full list of `transactions`.
   * Versioned variant introduced in beacon-APIs v3.
   */
  public async publishBlindedBlockV2(): ConsensusMethodResult<'publishBlindedBlockV2'> {
    throw new Error('Method is not implemented');
  }

  /** Retrieves block details for given block id. */
  public async getBlockV2(
    args: ConsensusMethodArgs<'getBlockV2'>,
  ): ConsensusMethodResult<'getBlockV2'> {
    const { blockId, options } = args;
    return await this.fetch(`/eth/v2/beacon/blocks/${blockId}`, options);
  }

  /** Retrieves hashTreeRoot of BeaconBlock/BeaconBlockHeader */
  public async getBlockRoot(
    args: ConsensusMethodArgs<'getBlockRoot'>,
  ): ConsensusMethodResult<'getBlockRoot'> {
    const { blockId, options } = args;
    return await this.fetch(`/eth/v1/beacon/blocks/${blockId}/root`, options);
  }

  /** Retrieves attestations included in requested block. Versioned response variant. */
  public async getBlockAttestationsV2(
    args: ConsensusMethodArgs<'getBlockAttestationsV2'>,
  ): ConsensusMethodResult<'getBlockAttestationsV2'> {
    const { blockId, options } = args;
    return await this.fetch(
      `/eth/v2/beacon/blocks/${blockId}/attestations`,
      options,
    );
  }

  /** Retrieves attestations known by the node but not necessarily incorporated into any block. Versioned response variant. */
  public async getPoolAttestationsV2(
    args?: ConsensusMethodArgs<'getPoolAttestationsV2'>,
  ): ConsensusMethodResult<'getPoolAttestationsV2'> {
    const { options, slot, committeeIndex } = args || {};
    const search = this.getSearchString({ slot, committeeIndex });
    return await this.fetch(
      `/eth/v2/beacon/pool/attestations${search}`,
      options,
    );
  }

  /** Submits Attestation objects to the node. Each attestation in the request body is processed individually. */
  public async submitPoolAttestationsV2(): ConsensusMethodResult<'submitPoolAttestationsV2'> {
    throw new Error('Method is not implemented');
  }

  /** Retrieves attester slashings known by the node but not necessarily incorporated into any block. Versioned response variant. */
  public async getPoolAttesterSlashingsV2(
    args?: ConsensusMethodArgs<'getPoolAttesterSlashingsV2'>,
  ): ConsensusMethodResult<'getPoolAttesterSlashingsV2'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v2/beacon/pool/attester_slashings`, options);
  }

  /** Submits AttesterSlashing object to node's pool and if passes validation node MUST broadcast it to network. */
  public async submitPoolAttesterSlashingsV2(): ConsensusMethodResult<'submitPoolAttesterSlashingsV2'> {
    throw new Error('Method is not implemented');
  }

  /** Retrieves payload attestations known by the node. Available from the Glamsterdam (Gloas) fork onwards. */
  public async getPoolPayloadAttestations(
    args?: ConsensusMethodArgs<'getPoolPayloadAttestations'>,
  ): ConsensusMethodResult<'getPoolPayloadAttestations'> {
    const { options, slot } = args || {};
    const search = this.getSearchString({ slot });
    return await this.fetch(
      `/eth/v1/beacon/pool/payload_attestations${search}`,
      options,
    );
  }

  /** Submits SignedPayloadAttestationMessage objects to the node. Available from the Glamsterdam (Gloas) fork onwards. */
  public async submitPayloadAttestationMessages(): ConsensusMethodResult<'submitPayloadAttestationMessages'> {
    throw new Error('Method is not implemented');
  }

  /**
   * Retrieves the SignedExecutionPayloadEnvelope for a given block id.
   * Introduced in Glamsterdam (Gloas) fork together with ePBS (EIP-7732).
   */
  public async getSignedExecutionPayloadEnvelope(
    args: ConsensusMethodArgs<'getSignedExecutionPayloadEnvelope'>,
  ): ConsensusMethodResult<'getSignedExecutionPayloadEnvelope'> {
    const { blockId, options } = args;
    return await this.fetch(
      `/eth/v1/beacon/execution_payload_envelope/${blockId}`,
      options,
    );
  }

  /**
   * Publishes a SignedExecutionPayloadBid built by an ePBS builder.
   * Introduced in Glamsterdam (Gloas) fork.
   */
  public async publishExecutionPayloadBid(): ConsensusMethodResult<'publishExecutionPayloadBid'> {
    throw new Error('Method is not implemented');
  }

  /**
   * Returns the proposer lookahead window for the given state.
   * Introduced in beacon-APIs v4 to expose pre-computed proposer schedule used by ePBS.
   */
  public async getProposerLookahead(
    args: ConsensusMethodArgs<'getProposerLookahead'>,
  ): ConsensusMethodResult<'getProposerLookahead'> {
    const { stateId, options } = args;
    return await this.fetch(
      `/eth/v1/beacon/states/${stateId}/proposer_lookahead`,
      options,
    );
  }

  /** Retrieves proposer slashings known by the node but not necessarily incorporated into any block */
  public async getPoolProposerSlashings(
    args?: ConsensusMethodArgs<'getPoolProposerSlashings'>,
  ): ConsensusMethodResult<'getPoolProposerSlashings'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/beacon/pool/proposer_slashings`, options);
  }

  /** Submits ProposerSlashing object to node's pool and if passes validation  node MUST broadcast it to network. */
  public async submitPoolProposerSlashings(): ConsensusMethodResult<'submitPoolProposerSlashings'> {
    throw new Error('Method is not implemented');
  }

  /** Submits sync committee signature objects to the node. */
  public async submitPoolSyncCommitteeSignatures(): ConsensusMethodResult<'submitPoolSyncCommitteeSignatures'> {
    throw new Error('Method is not implemented');
  }

  /** Retrieves voluntary exits known by the node but not necessarily incorporated into any block */
  public async getPoolVoluntaryExits(
    args?: ConsensusMethodArgs<'getPoolVoluntaryExits'>,
  ): ConsensusMethodResult<'getPoolVoluntaryExits'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/beacon/pool/voluntary_exits`, options);
  }

  /** Submits SignedVoluntaryExit object to node's pool and if passes validation node MUST broadcast it to network. */
  public async submitPoolVoluntaryExit(): ConsensusMethodResult<'submitPoolVoluntaryExit'> {
    throw new Error('Method is not implemented');
  }
}
