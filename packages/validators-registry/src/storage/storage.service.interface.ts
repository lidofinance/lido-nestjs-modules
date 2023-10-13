import { createInterface } from '@lido-nestjs/di';
import {
  ConsensusMeta,
  ConsensusValidatorsAndMetadata,
  Validator,
} from '../types';
import { ConsensusValidatorEntity } from './consensus-validator.entity';
import { FindOptions, FilterQuery } from './interfaces';
import { EntityManager } from '@mikro-orm/knex';

export const StorageServiceInterface = createInterface<StorageServiceInterface>(
  'StorageServiceInterface',
);

export interface StorageServiceInterface {
  /**
   * Get consensus meta from storage
   */
  getConsensusMeta(): Promise<ConsensusMeta | null>;

  /**
   * Return EntityManager instance
   */
  getEntityManager(): EntityManager;

  /**
   * delete all validators
   */
  deleteValidators(): Promise<void>;

  /**
   *
   * Update consensus validators
   */
  updateValidators(validators: Validator[]): Promise<void>;

  /**
   *
   * Update meta
   */
  updateMeta(meta: ConsensusMeta): Promise<void>;
  /**
   * Update all consensus validators and meta in storage in one transaction
   * (update existing validators in storage and insert not existing in storage)
   */
  updateValidatorsAndMeta(
    validators: Validator[],
    meta: ConsensusMeta,
  ): Promise<void>;

  /**
   * Get consensus validators from storage
   */
  getValidators(
    pubkeys?: string[],
    where?: FilterQuery<ConsensusValidatorEntity>,
    options?: FindOptions<ConsensusValidatorEntity>,
  ): Promise<Validator[]>;

  /**
   * Get consensus validators and consensus meta from storage in one transaction
   */
  getValidatorsAndMeta(
    pubkeys?: string[],
    where?: FilterQuery<ConsensusValidatorEntity>,
    options?: FindOptions<ConsensusValidatorEntity>,
  ): Promise<ConsensusValidatorsAndMetadata>;
}
