import { createInterface } from '@lido-nestjs/di';
import {
  ConsensusValidatorsAndMetadata,
  ConsensusMeta,
  ValidatorStatus,
} from '../types';
import { BlockId } from './block-id';
import { FilterQuery, FindOptions } from '@mikro-orm/core';
import { ConsensusValidatorEntity } from '../storage/consensus-validator.entity';

export const ValidatorsRegistryInterface =
  createInterface<ValidatorsRegistryInterface>('ValidatorsRegistryInterface');

export interface ValidatorsRegistryUpdateOptions {
  /**
   * Keep only validators with these statuses. The Consensus Layer filters them,
   * so the registry downloads and stores only that part of the validator set.
   */
  status?: ValidatorStatus[];
}

export interface ValidatorsRegistryInterface {
  /**
   * Update internal state of validators in the registry to the Consensus Layer (CL) state
   * according to `blockId`.
   *
   * @param {BlockId} blockId - Values: 'head', 'genesis', 'finalized', <slot>, <hex encoded blockRoot with 0x prefix>
   *
   * @param {ValidatorsRegistryUpdateOptions} options - `status` keeps only validators with these statuses
   *
   * If the registry internal state is newer or the same to the CL state - does nothing.
   */
  update(
    blockId: BlockId,
    options?: ValidatorsRegistryUpdateOptions,
  ): Promise<ConsensusMeta>;

  /**
   * Update internal state of validators in the registry to the Consensus Layer (CL) state
   * according to `blockId`. Reading validators in stream.
   *
   * @param {BlockId} blockId - Values: 'head', 'genesis', 'finalized', <slot>, <hex encoded blockRoot with 0x prefix>
   *
   * @param {ValidatorsRegistryUpdateOptions} options - `status` keeps only validators with these statuses
   *
   * If the registry internal state is newer or the same to the CL state - does nothing.
   */
  updateStream(
    blockId: BlockId,
    options?: ValidatorsRegistryUpdateOptions,
  ): Promise<ConsensusMeta>;

  /**
   * Get Metadata from registry internal state
   */
  getMeta(): Promise<ConsensusMeta | null>;

  /**
   * Get Validators and metadata from registry internal state
   */
  getValidators(
    pubkeys?: string[],
    where?: FilterQuery<ConsensusValidatorEntity>,
    options?: FindOptions<ConsensusValidatorEntity>,
  ): Promise<ConsensusValidatorsAndMetadata>;
}
