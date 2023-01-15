import { createInterface } from '@lido-nestjs/di';
import { ConsensusValidatorsAndMetadata, ConsensusMeta } from '../types';
import { SlotId } from './slot-id';

export const ValidatorsRegistryInterface =
  createInterface<ValidatorsRegistryInterface>('ValidatorsRegistryInterface');

export interface ValidatorsRegistryInterface {
  update(blockId: SlotId): Promise<ConsensusMeta | null>;
  getMeta(): Promise<ConsensusMeta | null>;
  getValidators(pubkeys?: string[]): Promise<ConsensusValidatorsAndMetadata>;
}
