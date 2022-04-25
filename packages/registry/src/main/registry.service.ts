import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Registry, REGISTRY_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { EntityManager } from '@mikro-orm/sqlite';
import { LOGGER_PROVIDER } from '@lido-nestjs/logger';

import { RegistryMetaFetchService } from '../fetch/meta.fetch';
import { RegistryKeyFetchService } from '../fetch/key.fetch';
import { RegistryOperatorFetchService } from '../fetch/operator.fetch';

import { RegistryMetaStorageService } from '../storage/meta.storage';
import { RegistryKeyStorageService } from '../storage/key.storage';
import { RegistryOperatorStorageService } from '../storage/operator.storage';

import { RegistryMeta } from '../storage/meta.entity';
import { RegistryKey } from '../storage/key.entity';
import { RegistryOperator } from '../storage/operator.entity';

import { compareMeta } from '../utils/meta.utils';
import { compareOperators } from '../utils/operator.utils';

@Injectable()
export class RegistryService {
  constructor(
    @Inject(REGISTRY_CONTRACT_TOKEN) private registryContract: Registry,
    @Inject(LOGGER_PROVIDER) private logger: LoggerService,

    private readonly metaFetch: RegistryMetaFetchService,
    private readonly metaStorage: RegistryMetaStorageService,

    private readonly keyFetch: RegistryKeyFetchService,
    private readonly keyStorage: RegistryKeyStorageService,

    private readonly operatorFetch: RegistryOperatorFetchService,
    private readonly operatorStorage: RegistryOperatorStorageService,

    private readonly entityManager: EntityManager,
  ) {}

  /** collects changed data from the contract and store it to the db */
  async update(blockHashOrBlockTag?: string | number) {
    const prevMeta = await this.getMetaDataFromStorage();
    const currMeta = await this.getMetaDataFromContract(blockHashOrBlockTag);
    const isSameContractState = compareMeta(prevMeta, currMeta);

    this.logger.log('Collected metadata', { prevMeta, currMeta });

    const previousBlockNumber = prevMeta?.blockNumber ?? -1;
    const currentBlockNumber = currMeta.blockNumber;

    if (previousBlockNumber > currentBlockNumber) {
      this.logger.warn('Previous data is newer than current data');
      return;
    }

    if (isSameContractState) {
      this.logger.debug?.('Same state, no data update required', { currMeta });
      await this.metaStorage.save(currMeta);
      this.logger.debug?.('Updated metadata in the DB', { currMeta });
      return;
    }

    const blockHash = currMeta.blockHash;

    const previousOperators = await this.getOperatorsFromStorage();
    const currentOperators = await this.getOperatorsFromContract(blockHash);

    this.logger.log('Collected operators', {
      previousOperators: previousOperators.length,
      currentOperators: currentOperators.length,
    });

    const updatedKeys = await this.getUpdatedKeysFromContract(
      previousOperators,
      currentOperators,
      blockHash,
    );

    this.logger.log('Fetched updated keys', {
      updatedKeys: updatedKeys.length,
    });

    // save all data in a transaction
    await this.entityManager.transactional(async (entityManager) => {
      updatedKeys.forEach(async (operatorKey) => {
        const instance = new RegistryKey(operatorKey);
        entityManager.persist(instance);
      });

      currentOperators.forEach(async (operator) => {
        const instance = new RegistryOperator(operator);
        entityManager.persist(instance);
      });

      const meta = new RegistryMeta(currMeta);
      entityManager.persist(meta);
    });

    this.logger.log('Saved data to the DB', {
      operators: currentOperators.length,
      updatedKeys: updatedKeys.length,
      currMeta,
    });
  }

  /** returns the latest meta data from the db */
  private async getMetaDataFromStorage() {
    return await this.metaStorage.get();
  }

  /** returns the meta data from the contract */
  private async getMetaDataFromContract(blockHashOrBlockTag?: string | number) {
    const { provider } = this.registryContract;
    const block = await provider.getBlock(blockHashOrBlockTag ?? 'latest');
    const blockHash = block.hash;
    const blockTag = { blockHash };

    // we must collect keysOpIndex & lastUnbufferedLog,
    // since `_increaseKeysOpIndex` in the contract does not occur on Unbuffer
    // this will be fixed in the next version of the contract
    const [keysOpIndex, lastUnbufferedLog] = await Promise.all([
      this.metaFetch.fetchKeysOpIndex({ blockTag }),
      this.metaFetch.fetchLastUnbufferedLog(block),
    ]);

    const unbufferedBlockNumber = lastUnbufferedLog.blockNumber;

    return {
      blockNumber: block.number,
      blockHash,
      keysOpIndex,
      unbufferedBlockNumber,
    };
  }

  /** returns the latest operators data from the db */
  private async getOperatorsFromStorage() {
    return await this.operatorStorage.findAll();
  }

  /** returns operators from the contract */
  private async getOperatorsFromContract(blockHash: string) {
    const overrides = { blockTag: { blockHash } };
    return await this.operatorFetch.fetch(0, -1, overrides);
  }

  /** returns keys from the contract */
  private async getKeysFromContract(
    operatorIndex: number,
    fromIndex: number,
    toIndex: number,
    blockHash: string,
  ) {
    const overrides = { blockTag: { blockHash } };

    return await this.keyFetch.fetch(
      operatorIndex,
      fromIndex,
      toIndex,
      overrides,
    );
  }

  /** returns updated keys from the contract */
  private async getUpdatedKeysFromContract(
    previousOperators: RegistryOperator[],
    currentOperators: RegistryOperator[],
    blockHash: string,
  ) {
    /**
     * TODO: optimize a number of queries
     * it's possible to update keys faster by using different strategies depending on the reason for the update
     */
    const keysByOperator = await Promise.all(
      currentOperators.map(async (currOperator, currentIndex) => {
        // check if the operator in the registry has changed since the last update
        const prevOperator = previousOperators[currentIndex] ?? null;
        const isSameOperator = compareOperators(prevOperator, currOperator);

        // skip updating keys from 0 to `usedSigningKeys` of previous collected data
        // since the contract guarantees that these keys cannot be changed
        const unchangedKeysMaxIndex = isSameOperator
          ? prevOperator.usedSigningKeys
          : 0;

        const fromIndex = unchangedKeysMaxIndex;
        const toIndex = currOperator.totalSigningKeys;
        const operatorIndex = currOperator.index;

        const result = await this.getKeysFromContract(
          operatorIndex,
          fromIndex,
          toIndex,
          blockHash,
        );

        this.logger.log('Keys fetched', {
          operatorIndex,
          fromIndex,
          toIndex,
          fetchedKeys: result.length,
        });

        return result;
      }),
    );

    return keysByOperator.flat();
  }

  /** clears the db */
  public async clear() {
    await this.entityManager.transactional(async (entityManager) => {
      entityManager.nativeDelete(RegistryKey, {});
      entityManager.nativeDelete(RegistryOperator, {});
      entityManager.nativeDelete(RegistryMeta, {});
    });
  }

  /** returns all operators from the db */
  public async getOperators() {
    return await this.operatorStorage.findAll();
  }

  /** returns all operators keys from the db */
  public async getAllKeys() {
    return await this.keyStorage.findAll();
  }

  /** returns used keys from the db */
  public async getUsedKeys() {
    return await this.keyStorage.findUsed();
  }

  public async subscribe() {
    // TODO
  }
}
