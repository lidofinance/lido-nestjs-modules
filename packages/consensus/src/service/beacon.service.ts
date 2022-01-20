import { ConsensusMethod } from '../interfaces';
import { ConsensusBaseService } from './base.service';

export class ConsensusBeaconService extends ConsensusBaseService {
  /** Retrieve details of the chain's genesis which can be used to identify chain. */
  public getGenesis: ConsensusMethod<'getGenesis'> = async function (args) {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/beacon/genesis`, options);
  };

  /** Calculates HashTreeRoot for state with given 'stateId'. If stateId is root, same value will be returned. */
  public getStateRoot: ConsensusMethod<'getStateRoot'> = async function (args) {
    const { stateId, options } = args || {};
    return await this.fetch(`/eth/v1/beacon/states/${stateId}/root`, options);
  };

  /** Returns Fork object for state with given 'stateId'. */
  public getStateFork: ConsensusMethod<'getStateFork'> = async function (args) {
    const { stateId, options } = args || {};
    return await this.fetch(`/eth/v1/beacon/states/${stateId}/fork`, options);
  };

  /**
   * Returns finality checkpoints for state with given 'stateId'.
   * In case finality is not yet achieved, checkpoint should return epoch 0 and ZERO_HASH as root.
   */
  public getStateFinalityCheckpoints: ConsensusMethod<'getStateFinalityCheckpoints'> =
    async function (args) {
      const { stateId, options } = args || {};
      return await this.fetch(
        `/eth/v1/beacon/states/${stateId}/finality_checkpoints`,
        options,
      );
    };

  /** Returns filterable list of validators with their balance, status and index. */
  public getStateValidators: ConsensusMethod<'getStateValidators'> =
    async function (args) {
      const { stateId, options } = args || {};
      return await this.fetch(
        `/eth/v1/beacon/states/${stateId}/validators`,
        options,
      );
    };

  /** Returns validator specified by state and id or public key along with status and balance. */
  public getStateValidator: ConsensusMethod<'getStateValidator'> =
    async function (args) {
      const { stateId, validatorId, options } = args ?? {};
      return await this.fetch(
        `/eth/v1/beacon/states/${stateId}/validators/${validatorId}`,
        options,
      );
    };

  /** Returns filterable list of validators balances. */
  public getStateValidatorBalances: ConsensusMethod<'getStateValidatorBalances'> =
    async function (args) {
      const { stateId, options } = args ?? {};
      return await this.fetch(
        `/eth/v1/beacon/states/${stateId}/validator_balances`,
        options,
      );
    };

  /** Retrieves the committees for the given state. */
  public getEpochCommittees: ConsensusMethod<'getEpochCommittees'> =
    async function (args) {
      const { stateId, options } = args ?? {};
      return await this.fetch(
        `/eth/v1/beacon/states/${stateId}/committees`,
        options,
      );
    };

  /** Retrieves the sync committees for the given state. */
  public getEpochSyncCommittees: ConsensusMethod<'getEpochSyncCommittees'> =
    async function (args) {
      const { stateId, options } = args ?? {};
      return await this.fetch(
        `/eth/v1/beacon/states/${stateId}/sync_committees`,
        options,
      );
    };

  /** Retrieves block headers matching given query. By default it will fetch current head slot blocks. */
  public getBlockHeaders: ConsensusMethod<'getBlockHeaders'> = async function (
    args,
  ) {
    const { options } = args ?? {};
    return await this.fetch(`/eth/v1/beacon/headers`, options);
  };

  /** Retrieves block header for given block id. */
  public getBlockHeader: ConsensusMethod<'getBlockHeader'> = async function (
    args,
  ) {
    const { blockId, options } = args ?? {};
    return await this.fetch(`/eth/v1/beacon/headers/${blockId}`, options);
  };

  /**
   * Instructs the beacon node to broadcast a newly signed beacon block to the beacon network,
   * to be included in the beacon chain.
   */
  public publishBlock: ConsensusMethod<'publishBlock'> = async function () {
    throw new Error('Method is not implemented');
  };

  /** Returns the complete `SignedBeaconBlock` for a given block id. */
  public getBlock: ConsensusMethod<'getBlock'> = async function (args) {
    const { blockId, options } = args ?? {};
    return await this.fetch(`/eth/v1/beacon/blocks/${blockId}`, options);
  };

  /** Retrieves hashTreeRoot of BeaconBlock/BeaconBlockHeader */
  public getBlockRoot: ConsensusMethod<'getBlockRoot'> = async function (args) {
    const { blockId, options } = args ?? {};
    return await this.fetch(`/eth/v1/beacon/blocks/${blockId}/root`, options);
  };

  /** Retrieves attestation included in requested block. */
  public getBlockAttestations: ConsensusMethod<'getBlockAttestations'> =
    async function (args) {
      const { blockId, options } = args ?? {};
      return await this.fetch(
        `/eth/v1/beacon/blocks/${blockId}/attestations`,
        options,
      );
    };

  /** Retrieves attestations known by the node but not necessarily incorporated into any block */
  public getPoolAttestations: ConsensusMethod<'getPoolAttestations'> =
    async function (args) {
      const { options } = args ?? {};
      return await this.fetch(`/eth/v1/beacon/pool/attestations`, options);
    };

  /** Submits Attestation objects to the node. Each attestation in the request body is processed individually. */
  public submitPoolAttestations: ConsensusMethod<'submitPoolAttestations'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Retrieves attester slashings known by the node but not necessarily incorporated into any block */
  public getPoolAttesterSlashings: ConsensusMethod<'getPoolAttesterSlashings'> =
    async function (args) {
      const { options } = args ?? {};
      return await this.fetch(
        `/eth/v1/beacon/pool/attester_slashings`,
        options,
      );
    };

  /** Submits AttesterSlashing object to node's pool and if passes validation node MUST broadcast it to network. */
  public submitPoolAttesterSlashings: ConsensusMethod<'submitPoolAttesterSlashings'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Retrieves proposer slashings known by the node but not necessarily incorporated into any block */
  public getPoolProposerSlashings: ConsensusMethod<'getPoolProposerSlashings'> =
    async function (args) {
      const { options } = args ?? {};
      return await this.fetch(
        `/eth/v1/beacon/pool/proposer_slashings`,
        options,
      );
    };

  /** Submits ProposerSlashing object to node's pool and if passes validation  node MUST broadcast it to network. */
  public submitPoolProposerSlashings: ConsensusMethod<'submitPoolProposerSlashings'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Submits sync committee signature objects to the node. */
  public submitPoolSyncCommitteeSignatures: ConsensusMethod<'submitPoolSyncCommitteeSignatures'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Retrieves voluntary exits known by the node but not necessarily incorporated into any block */
  public getPoolVoluntaryExits: ConsensusMethod<'getPoolProposerSlashings'> =
    async function (args) {
      const { options } = args ?? {};
      return await this.fetch(`/eth/v1/beacon/pool/voluntary_exits`, options);
    };

  /** Submits SignedVoluntaryExit object to node's pool and if passes validation node MUST broadcast it to network. */
  public submitPoolVoluntaryExit: ConsensusMethod<'submitPoolVoluntaryExit'> =
    async function () {
      throw new Error('Method is not implemented');
    };
}
