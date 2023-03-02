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
   * to be included in the beacon chain.
   */
  public async publishBlock(): ConsensusMethodResult<'publishBlock'> {
    throw new Error('Method is not implemented');
  }

  /**
   * Instructs the beacon node to use the components of the `SignedBlindedBeaconBlock` to construct and publish a
   * `SignedBeaconBlock` by swapping out the `transactions_root` for the corresponding full list of `transactions`.
   */
  public async publishBlindedBlock(): ConsensusMethodResult<'publishBlindedBlock'> {
    throw new Error('Method is not implemented');
  }

  /** Returns the complete `SignedBeaconBlock` for a given block id. */
  public async getBlock(
    args: ConsensusMethodArgs<'getBlock'>,
  ): ConsensusMethodResult<'getBlock'> {
    const { blockId, options } = args;
    return await this.fetch(`/eth/v1/beacon/blocks/${blockId}`, options);
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

  /** Retrieves attestation included in requested block. */
  public async getBlockAttestations(
    args: ConsensusMethodArgs<'getBlockAttestations'>,
  ): ConsensusMethodResult<'getBlockAttestations'> {
    const { blockId, options } = args;
    return await this.fetch(
      `/eth/v1/beacon/blocks/${blockId}/attestations`,
      options,
    );
  }

  /** Retrieves attestations known by the node but not necessarily incorporated into any block */
  public async getPoolAttestations(
    args?: ConsensusMethodArgs<'getPoolAttestations'>,
  ): ConsensusMethodResult<'getPoolAttestations'> {
    const { options, slot, committeeIndex } = args || {};
    const search = this.getSearchString({ slot, committeeIndex });
    return await this.fetch(
      `/eth/v1/beacon/pool/attestations${search}`,
      options,
    );
  }

  /** Submits Attestation objects to the node. Each attestation in the request body is processed individually. */
  public async submitPoolAttestations(): ConsensusMethodResult<'submitPoolAttestations'> {
    throw new Error('Method is not implemented');
  }

  /** Retrieves attester slashings known by the node but not necessarily incorporated into any block */
  public async getPoolAttesterSlashings(
    args?: ConsensusMethodArgs<'getPoolAttesterSlashings'>,
  ): ConsensusMethodResult<'getPoolAttesterSlashings'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/beacon/pool/attester_slashings`, options);
  }

  /** Submits AttesterSlashing object to node's pool and if passes validation node MUST broadcast it to network. */
  public async submitPoolAttesterSlashings(): ConsensusMethodResult<'submitPoolAttesterSlashings'> {
    throw new Error('Method is not implemented');
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
