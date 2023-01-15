import { createInterface } from '@lido-nestjs/di';
import {
  ConsensusMeta,
  ConsensusValidatorsAndMetadata,
  Validator,
} from '../types';

export const StorageServiceInterface = createInterface<StorageServiceInterface>(
  'StorageServiceInterface',
);

export interface StorageServiceInterface {
  /**
   * Get consensus meta from storage
   */
  getConsensusMeta(): Promise<ConsensusMeta | null>;

  /**
   * Update all consensus validators and meta in storage in one transaction
   * (update existing validators in storage and insert not existing in storage)
   */
  updateValidatorsAndMeta(
    validators: Validator[],
    meta: ConsensusMeta,
  ): Promise<number>;

  /**
   * Get consensus validators from storage
   */
  getValidators(pubkeys?: string[]): Promise<Validator[]>;

  /**
   * Get consensus validators and consensus meta from storage in one transaction
   */
  getValidatorsAndMeta(
    pubkeys?: string[],
  ): Promise<ConsensusValidatorsAndMetadata>;
}
