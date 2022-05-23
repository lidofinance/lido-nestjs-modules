import { Inject, Injectable, LoggerService, Optional } from '@nestjs/common';
import { Registry, REGISTRY_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { EntityManager } from '@mikro-orm/sqlite';
import { LOGGER_PROVIDER } from '@lido-nestjs/logger';

import EventEmmiter from 'events';

import { RegistryMetaFetchService } from '../fetch/meta.fetch';
import { RegistryKeyFetchService } from '../fetch/key.fetch';
import { RegistryOperatorFetchService } from '../fetch/operator.fetch';

import { RegistryMetaStorageService } from '../storage/meta.storage';
import { RegistryKeyStorageService } from '../storage/key.storage';
import { RegistryOperatorStorageService } from '../storage/operator.storage';

import { RegistryMeta } from '../storage/meta.entity';
import { RegistryKey } from '../storage/key.entity';
import { RegistryOperator } from '../storage/operator.entity';

import { compareAllMeta } from '../utils/meta.utils';
import { compareOperators } from '../utils/operator.utils';
import { loop } from '../utils/loop.utils';
import { REGISTRY_GLOBAL_OPTIONS_TOKEN } from './constants';
import { RegistryFetchOptions } from '../fetch/interfaces/module.interface';

@Injectable()
export class AbstractService {
  eventEmmiter: EventEmmiter;
  activeLoop?: () => void;
  constructor(
    @Inject(REGISTRY_CONTRACT_TOKEN) protected registryContract: Registry,
    @Inject(LOGGER_PROVIDER) private logger: LoggerService,

    protected readonly metaFetch: RegistryMetaFetchService,
    private readonly metaStorage: RegistryMetaStorageService,

    private readonly keyFetch: RegistryKeyFetchService,
    private readonly keyStorage: RegistryKeyStorageService,

    private readonly operatorFetch: RegistryOperatorFetchService,
    private readonly operatorStorage: RegistryOperatorStorageService,

    private readonly entityManager: EntityManager,

    @Optional()
    @Inject(REGISTRY_GLOBAL_OPTIONS_TOKEN)
    public options?: RegistryFetchOptions,
  ) {
    this.eventEmmiter = new EventEmmiter();
  }
  private createLoop() {
    if (this.activeLoop) return;

    const unsub = loop(
      this.options?.subscribeInterval || 10_000,
      async () => {
        try {
          const result = await this.update('latest');
          if (!result) return;
          this.eventEmmiter.emit('result', result);
        } catch (error) {
          this.eventEmmiter.emit('error', error);
        }
      },
      (loopError) => this.eventEmmiter.emit('error', loopError),
    );

    this.activeLoop = () => {
      unsub();
      delete this.activeLoop;
    };
  }

  private collectListenerCount() {
    return (
      this.eventEmmiter.listenerCount('result') +
      this.eventEmmiter.listenerCount('error')
    );
  }

  public subscribe(cb: (error: null | Error, payload: RegistryKey[]) => void) {
    this.createLoop();
    const resultCb = (result: RegistryKey[]) => cb(null, result);
    this.eventEmmiter.addListener('result', resultCb);
    this.eventEmmiter.addListener('error', cb);
    return () => {
      this.eventEmmiter.off('result', resultCb);
      this.eventEmmiter.off('error', cb);
      if (!this.collectListenerCount() && this.activeLoop) {
        this.activeLoop();
      }
    };
  }

  public compareMeta = compareAllMeta;
  /** collects changed data from the contract and store it to the db */
  async update(blockHashOrBlockTag: string | number) {
    const prevMeta = await this.getMetaDataFromStorage();
    const currMeta = await this.getMetaDataFromContract(blockHashOrBlockTag);
    const isSameContractState = this.compareMeta(prevMeta, currMeta);

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

    return updatedKeys;
  }

  /** contract */

  /** returns the meta data from the contract */
  public async getMetaDataFromContract(
    blockHashOrBlockTag: string | number,
  ): Promise<RegistryMeta> {
    const { provider } = this.registryContract;
    const block = await provider.getBlock(blockHashOrBlockTag);
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

  /** returns operators from the contract */
  public async getOperatorsFromContract(blockHash: string) {
    const overrides = { blockTag: { blockHash } };
    return await this.operatorFetch.fetch(0, -1, overrides);
  }

  public getLastKey(prevOperator: RegistryOperator) {
    return prevOperator.totalSigningKeys;
  }

  /** returns updated keys from the contract */
  public async getUpdatedKeysFromContract(
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
          ? this.getLastKey(prevOperator)
          : 0;

        const fromIndex = unchangedKeysMaxIndex;
        const toIndex = currOperator.totalSigningKeys;
        const operatorIndex = currOperator.index;
        const overrides = { blockTag: { blockHash } };

        const result = await this.keyFetch.fetch(
          operatorIndex,
          fromIndex,
          toIndex,
          overrides,
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

  /** storage */

  /** returns the latest meta data from the db */
  public async getMetaDataFromStorage() {
    return await this.metaStorage.get();
  }

  /** returns the latest operators data from the db */
  public async getOperatorsFromStorage() {
    return await this.operatorStorage.findAll();
  }

  /** returns all operators keys from the db */
  public async getAllKeysFromStorage() {
    return await this.keyStorage.findAll();
  }

  /** returns used keys from the db */
  public async getUsedKeysFromStorage() {
    return await this.keyStorage.findUsed();
  }

  /** clears the db */
  public async clear() {
    await this.entityManager.transactional(async (entityManager) => {
      entityManager.nativeDelete(RegistryKey, {});
      entityManager.nativeDelete(RegistryOperator, {});
      entityManager.nativeDelete(RegistryMeta, {});
    });
  }
}
