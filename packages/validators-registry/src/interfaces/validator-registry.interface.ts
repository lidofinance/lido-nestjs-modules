import { createInterface } from '@lido-nestjs/di';
import { ConsensusValidatorsAndMetadata, ConsensusMeta } from '../types';
import { BlockId } from './block-id';

export const ValidatorsRegistryInterface =
  createInterface<ValidatorsRegistryInterface>('ValidatorsRegistryInterface');

export interface ValidatorsRegistryInterface {
  /**
   * Update internal state of validators in the registry to the Consensus Layer (CL) state
   * according to `blockId`.
   *
   * @param {BlockId} blockId - Values: 'head', 'genesis', 'finalized', <slot>, <hex encoded blockRoot with 0x prefix>
   *
   * If the registry internal state is newer or the same to the CL state - does nothing.
   */
  update(blockId: BlockId): Promise<ConsensusMeta | null>;

  /**
   * Get Metadata from registry internal state
   */
  getMeta(): Promise<ConsensusMeta | null>;

  /**
   * Get Validators and metadata from registry internal state
   */
  getValidators(pubkeys?: string[]): Promise<ConsensusValidatorsAndMetadata>;
}