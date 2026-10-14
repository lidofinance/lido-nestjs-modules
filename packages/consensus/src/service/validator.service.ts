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

  /**
   * Request beacon node to provide all validators that are scheduled to propose a block in the given epoch.
   * @deprecated Use getProposerDutiesV2.
   */
  public async getProposerDuties(
    args: ConsensusMethodArgs<'getProposerDuties'>,
  ): ConsensusMethodResult<'getProposerDuties'> {
    const { epoch, options } = args;
    return await this.fetch(
      `/eth/v1/validator/duties/proposer/${epoch}`,
      options,
    );
  }

  /**
   * Request beacon node to provide all validators that are scheduled to propose a block in the given epoch.
   * Same duties as v1. The `dependent_root` is computed so that it stays valid with the Fulu proposer lookahead.
   */
  public async getProposerDutiesV2(
    args: ConsensusMethodArgs<'getProposerDutiesV2'>,
  ): ConsensusMethodResult<'getProposerDutiesV2'> {
    const { epoch, options } = args;
    return await this.fetch(
      `/eth/v2/validator/duties/proposer/${epoch}`,
      options,
    );
  }

  /**
   * Requests the beacon node to provide a set of Payload Timeliness Committee duties for the given epoch.
   * Introduced in Glamsterdam (Gloas) for ePBS.
   */
  public async getPtcDuties(): ConsensusMethodResult<'getPtcDuties'> {
    throw new Error('Method is not implemented');
  }

  /** Requests the beacon node to provide a set of sync committee duties for a particular epoch. */
  public async getSyncCommitteeDuties(): ConsensusMethodResult<'getSyncCommitteeDuties'> {
    throw new Error('Method is not implemented');
  }

  /**
   * Aggregates all attestations matching given attestation data root, slot and committee index.
   * Versioned response variant; the v1 variant has been removed from beacon-APIs.
   */
  public async getAggregatedAttestationV2(
    args: ConsensusMethodArgs<'getAggregatedAttestationV2'>,
  ): ConsensusMethodResult<'getAggregatedAttestationV2'> {
    const { slot, attestationDataRoot, committeeIndex, options } = args;
    const search = this.getSearchString({
      slot,
      attestationDataRoot,
      committeeIndex,
    });
    return await this.fetch(
      `/eth/v2/validator/aggregate_attestation${search}`,
      options,
    );
  }

  /**
   * Requests a beacon node to produce a valid block, which can then be signed by a validator.
   * @deprecated Use produceBlockV4 from the Gloas fork on.
   */
  public async produceBlockV3(
    args: ConsensusMethodArgs<'produceBlockV3'>,
  ): ConsensusMethodResult<'produceBlockV3'> {
    const { slot, randaoReveal, graffiti, options } = args;
    const search = this.getSearchString({ randaoReveal, graffiti });
    return await this.fetch(
      `/eth/v3/validator/blocks/${slot}${search}`,
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

  /**
   * Requests the beacon node to produce a PayloadAttestationData object for the given slot.
   * Introduced in Glamsterdam (Gloas) for ePBS.
   * Resolves to null when the node answers 204: it has no block for the slot yet.
   */
  public async producePayloadAttestationData(
    args: ConsensusMethodArgs<'producePayloadAttestationData'>,
  ): Promise<Awaited<
    ConsensusMethodResult<'producePayloadAttestationData'>
  > | null> {
    const { slot, options } = args;
    const search = this.getSearchString({ slot });
    return await this.fetchOptional(
      `/eth/v1/validator/payload_attestation_data${search}`,
      options,
    );
  }

  /**
   * Verifies given aggregate and proofs and publishes them on appropriate gossipsub topic.
   * Versioned variant introduced in beacon-APIs v3.
   */
  public async publishAggregateAndProofsV2(): ConsensusMethodResult<'publishAggregateAndProofsV2'> {
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

  /**
   * Requests a beacon node to produce a valid block from the Gloas fork on.
   * The execution payload is not part of the block, it comes in a separate envelope.
   */
  public async produceBlockV4(): ConsensusMethodResult<'produceBlockV4'> {
    throw new Error('Method is not implemented');
  }

  /** Returns the execution payload envelope that the node built for its own block. Introduced in Glamsterdam (Gloas). */
  public async getExecutionPayloadEnvelope(): ConsensusMethodResult<'getExecutionPayloadEnvelope'> {
    throw new Error('Method is not implemented');
  }

  /** Submits signed proposer preferences (fee recipient, gas limit) for upcoming proposals. Introduced in Glamsterdam (Gloas). */
  public async submitProposerPreferences(): ConsensusMethodResult<'submitProposerPreferences'> {
    throw new Error('Method is not implemented');
  }

  /** Submits builder preferences of the validators connected to the node. Introduced in Glamsterdam (Gloas). */
  public async submitBuilderPreferences(): ConsensusMethodResult<'submitBuilderPreferences'> {
    throw new Error('Method is not implemented');
  }

  /**
   * Prepares the beacon node for potential proposers by supplying information required when proposing blocks for the given validators.
   * @deprecated Use submitProposerPreferences from the Gloas fork on.
   */
  public async prepareBeaconProposer(): ConsensusMethodResult<'prepareBeaconProposer'> {
    throw new Error('Method is not implemented');
  }

  /**
   * Prepares the beacon node for engaging with external builders.
   * @deprecated Not used from the Gloas fork on.
   */
  public async registerValidator(): ConsensusMethodResult<'registerValidator'> {
    throw new Error('Method is not implemented');
  }
}
