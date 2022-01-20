import { ConsensusMethod } from '../interfaces';
import { ConsensusBaseService } from './base.service';

export class ConsensusValidatorService extends ConsensusBaseService {
  /** Requests the beacon node to provide a set of attestation duties, which should be performed by validators, for a particular epoch. */
  public getAttesterDuties: ConsensusMethod<'getAttesterDuties'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Request beacon node to provide all validators that are scheduled to propose a block in the given epoch. */
  public getProposerDuties: ConsensusMethod<'getProposerDuties'> =
    async function (args) {
      const { epoch, options } = args || {};
      return await this.fetch(
        `/eth/v1/validator/duties/proposer/${epoch}`,
        options,
      );
    };

  /** Requests the beacon node to provide a set of sync committee duties for a particular epoch. */
  public getSyncCommitteeDuties: ConsensusMethod<'getSyncCommitteeDuties'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Requests a beacon node to produce a valid block, which can then be signed by a validator. */
  public produceBlock: ConsensusMethod<'produceBlock'> = async function (args) {
    const { slot, options } = args || {};
    return await this.fetch(`/eth/v1/validator/blocks/${slot}`, options);
  };

  /** Requests a beacon node to produce a valid block, which can then be signed by a validator. */
  public produceBlockV2: ConsensusMethod<'produceBlockV2'> = async function (
    args,
  ) {
    const { slot, options } = args || {};
    return await this.fetch(`/eth/v2/validator/blocks/${slot}`, options);
  };

  /** Requests that the beacon node produce an AttestationData. */
  public produceAttestationData: ConsensusMethod<'produceAttestationData'> =
    async function (args) {
      const { options } = args || {};
      return await this.fetch(`/eth/v2/validator/attestation_data`, options);
    };

  /** Aggregates all attestations matching given attestation data root and slot */
  public getAggregatedAttestation: ConsensusMethod<'getAggregatedAttestation'> =
    async function (args) {
      const { options } = args || {};
      return await this.fetch(
        `/eth/v2/validator/aggregate_attestation`,
        options,
      );
    };

  /** Verifies given aggregate and proofs and publishes them on appropriate gossipsub topic. */
  public publishAggregateAndProofs: ConsensusMethod<'publishAggregateAndProofs'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /**
   * After beacon node receives this request, search using discv5 for peers related to this subnet
   * and replace current peers with those ones if necessary
   */
  public prepareBeaconCommitteeSubnet: ConsensusMethod<'prepareBeaconCommitteeSubnet'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Subscribe to a number of sync committee subnets */
  public prepareSyncCommitteeSubnets: ConsensusMethod<'prepareSyncCommitteeSubnets'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Requests that the beacon node produce a sync committee contribution. */
  public produceSyncCommitteeContribution: ConsensusMethod<'produceSyncCommitteeContribution'> =
    async function (args) {
      const { options } = args || {};
      return await this.fetch(
        `/eth/v2/validator/sync_committee_contribution`,
        options,
      );
    };

  /** Publish multiple signed sync committee contribution and proofs */
  public publishContributionAndProofs: ConsensusMethod<'publishContributionAndProofs'> =
    async function () {
      throw new Error('Method is not implemented');
    };

  /** Provides endpoint to subscribe to beacon node Consensus-Sent-Events stream. */
  public eventstream: ConsensusMethod<'eventstream'> = async function () {
    throw new Error('Method is not implemented');
  };
}
