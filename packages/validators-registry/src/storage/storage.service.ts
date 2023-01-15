import {
  ConsensusMeta,
  ConsensusValidatorsAndMetadata,
  Validator,
  Validators,
} from '../types';
import { ConsensusMetaEntity } from './consensus-meta.entity';
import { StorageServiceInterface } from './storage.service.interface';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { IsolationLevel, MikroORM, QueryOrder } from '@mikro-orm/core';
import { NUM_VALIDATORS_MAX_CHUNK } from '../constants';
import { ConsensusValidatorEntity } from './consensus-validator.entity';
import { chunk } from '@lido-nestjs/utils/src';

@Injectable()
export class StorageService
  implements StorageServiceInterface, OnModuleDestroy
{
  public constructor(protected readonly orm: MikroORM) {}

  public async onModuleDestroy(): Promise<void> {
    await this.orm.close();
  }

  public get entityManager() {
    // It will automatically pick the request specific context under the hood, or use global entity manager
    return this.orm.em;
  }

  /**
   * @inheritDoc
   */
  public async getConsensusMeta(): Promise<ConsensusMeta | null> {
    const metaEntities = await this.entityManager
      .getRepository(ConsensusMetaEntity)
      .find(
        {},
        {
          orderBy: { blockNumber: QueryOrder.DESC },
          limit: 1,
        },
      );

    const metaEntity = metaEntities.pop();

    if (!metaEntity) {
      // default meta
      return null;
    }

    // runtime type check
    return ConsensusMeta.parse({
      slot: metaEntity.slot,
      blockNumber: metaEntity.blockNumber,
      blockHash: metaEntity.blockHash.toLocaleLowerCase(),
      slotStateRoot: metaEntity.slotStateRoot.toLocaleLowerCase(),
      timestamp: metaEntity.timestamp,
    });
  }

  /**
   * @inheritDoc
   */
  public async updateValidatorsAndMeta(
    validators: Validator[],
    meta: ConsensusMeta,
  ): Promise<number> {
    return this.entityManager.transactional(
      async () => {
        await this.updateMeta(meta);
        return await this.updateValidators(validators);
      },
      { isolationLevel: IsolationLevel.SERIALIZABLE },
    );
  }

  protected async updateValidators(validators: Validator[]): Promise<number> {
    // runtime type check
    const validatorsChecked = Validators.parse(validators);

    const validatorsPartitions = chunk(
      validatorsChecked,
      NUM_VALIDATORS_MAX_CHUNK,
    );

    const promises = validatorsPartitions
      .map((vals) => vals.map((x) => new ConsensusValidatorEntity(x)))
      .map((x) =>
        this.orm.em.getRepository(ConsensusValidatorEntity).upsertAll(x),
      );

    const results = await Promise.all(promises);

    return results.reduce((sum, res) => sum + res.changes, 0);
  }

  /**
   * @inheritDoc
   */
  protected async updateMeta(meta: ConsensusMeta): Promise<void> {
    // runtime type check
    const metaChecked = ConsensusMeta.parse(meta);
    const metaEntity = new ConsensusMetaEntity(metaChecked);

    await this.entityManager
      .getRepository(ConsensusMetaEntity)
      .upsert(metaEntity);
  }

  public async getValidators(pubkeys?: string[]): Promise<Validator[]> {
    const pubkeysLowercase = pubkeys?.map((p) => p.toLocaleLowerCase());

    const validators = await this.entityManager
      .getRepository(ConsensusValidatorEntity)
      .findAll();

    // runtime type check
    const checkedValidators = Validators.parse(validators);

    const validatorsFiltered = pubkeysLowercase
      ? checkedValidators.filter((x) => pubkeysLowercase.includes(x.pubkey))
      : checkedValidators;

    return validatorsFiltered;
  }

  /**
   * @inheritDoc
   */
  public async getValidatorsAndMeta(
    pubkeys?: string[],
  ): Promise<ConsensusValidatorsAndMetadata> {
    return this.entityManager.transactional(
      async () => {
        const meta = await this.getConsensusMeta();

        if (meta === null) {
          return {
            meta,
            validators: [],
          };
        }

        const validators = await this.getValidators(pubkeys);

        return {
          meta,
          validators,
        };
      },
      { isolationLevel: IsolationLevel.SERIALIZABLE },
    );
  }
}
