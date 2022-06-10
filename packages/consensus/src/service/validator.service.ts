import {
  ConsensusMethodArgs,
  ConsensusMethodResult,
} from '../interfaces/consensus.interface';
import { ConsensusBaseService } from './base.service';

export class ConsensusValidatorService extends ConsensusBaseService {
  /** Requests the beacon node to provide a set of attestation duties, which should be performed by validators, for a particular epoch. */
  public async getAttesterDuties(): ConsensusMethodResult<'getAttesterDuties'> {
    throw new Error('Method is not implemented');
  }

  /** Request beacon node to provide all validators that are scheduled to propose a block in the given epoch. */
  public async getProposerDuties(
    args: ConsensusMethodArgs<'getProposerDuties'>,
  ): ConsensusMethodResult<'getProposerDuties'> {
    const { epoch, options } = args;
    return await this.fetch(
      `/eth/v1/validator/duties/proposer/${epoch}`,
      options,
    );
  }

  /** Requests the beacon node to provide a set of sync committee duties for a particular epoch. */
  public async getSyncCommitteeDuties(): ConsensusMethodResult<'getSyncCommitteeDuties'> {
    throw new Error('Method is not implemented');
  }

  /** Requests a beacon node to produce a valid block, which can then be signed by a validator. */
  public async produceBlock(
    args: ConsensusMethodArgs<'produceBlock'>,
  ): ConsensusMethodResult<'produceBlock'> {
    const { slot, randaoReveal, graffiti, options } = args;
    const search = this.getSearchString({ randaoReveal, graffiti });
    return await this.fetch(
      `/eth/v1/validator/blocks/${slot}${search}`,
      options,
    );
  }

  /** Requests a beacon node to produce a valid block, which can then be signed by a validator. */
  public async produceBlockV2(
    args: ConsensusMethodArgs<'produceBlockV2'>,
  ): ConsensusMethodResult<'produceBlockV2'> {
    const { slot, randaoReveal, graffiti, options } = args;
    const search = this.getSearchString({ randaoReveal, graffiti });
    return await this.fetch(
      `/eth/v2/validator/blocks/${slot}${search}`,
      options,
    );
  }

  /*** Requests a beacon node to produce a valid blinded block, which can then be signed by a validator. */
  public async produceBlindedBlock(
    args: ConsensusMethodArgs<'produceBlindedBlock'>,
  ): ConsensusMethodResult<'produceBlindedBlock'> {
    const { slot, randaoReveal, graffiti, options } = args;
    const search = this.getSearchString({ randaoReveal, graffiti });
    return await this.fetch(
      `/eth/v1/validator/blinded_blocks/${slot}${search}`,
      options,
    );
  }

  /** Requests that the beacon node produce an AttestationData. */
  public async produceAttestationData(
    args: ConsensusMethodArgs<'produceAttestationData'>,
  ): ConsensusMethodResult<'produceAttestationData'> {
    const { slot, committeeIndex, options } = args;
    const search = this.getSearchString({ slot, committeeIndex });
    return await this.fetch(
      `/eth/v1/validator/attestation_data${search}`,
      options,
    );
  }

  /** Aggregates all attestations matching given attestation data root and slot */
  public async getAggregatedAttestation(
    args: ConsensusMethodArgs<'getAggregatedAttestation'>,
  ): ConsensusMethodResult<'getAggregatedAttestation'> {
    const { slot, attestationDataRoot, options } = args;
    const search = this.getSearchString({ slot, attestationDataRoot });
    return await this.fetch(
      `/eth/v1/validator/aggregate_attestation${search}`,
      options,
    );
  }

  /** Verifies given aggregate and proofs and publishes them on appropriate gossipsub topic. */
  public async publishAggregateAndProofs(): ConsensusMethodResult<'publishAggregateAndProofs'> {
    throw new Error('Method is not implemented');
  }

  /**
   * After beacon node receives this request, search using discv5 for peers related to this subnet
   * and replace current peers with those ones if necessary
   */
  public async prepareBeaconCommitteeSubnet(): ConsensusMethodResult<'prepareBeaconCommitteeSubnet'> {
    throw new Error('Method is not implemented');
  }

  /** Subscribe to a number of sync committee subnets */
  public async prepareSyncCommitteeSubnets(): ConsensusMethodResult<'prepareSyncCommitteeSubnets'> {
    throw new Error('Method is not implemented');
  }

  /** Requests that the beacon node produce a sync committee contribution. */
  public async produceSyncCommitteeContribution(
    args: ConsensusMethodArgs<'produceSyncCommitteeContribution'>,
  ): ConsensusMethodResult<'produceSyncCommitteeContribution'> {
    const { slot, subcommitteeIndex, beaconBlockRoot, options } = args;
    const search = this.getSearchString({
      slot,
      subcommitteeIndex,
      beaconBlockRoot,
    });
    return await this.fetch(
      `/eth/v1/validator/sync_committee_contribution${search}`,
      options,
    );
  }

  /** Publish multiple signed sync committee contribution and proofs */
  public async publishContributionAndProofs(): ConsensusMethodResult<'publishContributionAndProofs'> {
    throw new Error('Method is not implemented');
  }

  /** Prepares the beacon node for potential proposers by supplying information required when proposing blocks for the given validators. */
  public async prepareBeaconProposer(): ConsensusMethodResult<'prepareBeaconProposer'> {
    throw new Error('Method is not implemented');
  }

  /** Prepares the beacon node for engaging with external builders. */
  public async registerValidator(): ConsensusMethodResult<'registerValidator'> {
    throw new Error('Method is not implemented');
  }
}
