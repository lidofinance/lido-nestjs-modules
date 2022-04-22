import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Registry, REGISTRY_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { LOGGER_PROVIDER } from '@lido-nestjs/logger';
import { RegistryMetaFetchService } from '../fetch/meta.fetch';
import { RegistryKeyFetchService } from '../fetch/key.fetch';
import { RegistryOperatorFetchService } from '../fetch/operator.fetch';
import { RegistryMetaStorageService } from '../storage/meta.storage';
import { RegistryKeyStorageService } from '../storage/key.storage';
import { RegistryOperatorStorageService } from '../storage/operator.storage';
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
  ) {}

  /** collects changed data from the contract and store it to the db */
  async update(blockNumber: number | null = null) {
    const prevMeta = await this.getMetaDataFromStorage();
    const currMeta = await this.getMetaDataFromContract(blockNumber);
    const isSameMeta = compareMeta(prevMeta, currMeta);

    this.logger.log('Collected metadata', { prevMeta, currMeta });

    const previousBlockNumber = prevMeta?.blockNumber ?? -1;
    const currentBlockNumber = currMeta.blockNumber;

    if (previousBlockNumber > currentBlockNumber) {
      this.logger.warn('Previous data is newer than current data');
      return;
    }

    if (isSameMeta) {
      // keysOpIndex and unbufferedBlockNumber are the same
      // no update required
      return;
    }

    const blockHash = currMeta.blockHash;

    const previousOperators = await this.getOperatorsFromStorage();
    const currentOperators = await this.getOperatorsFromContract(blockHash);

    const updatedKeys = await this.getUpdatedKeysFromContract(
      previousOperators,
      currentOperators,
      blockHash,
    );

    // TODO: wrap in transaction
    await this.keyStorage.save(updatedKeys);
    await this.operatorStorage.save(currentOperators);
    await this.metaStorage.save(currMeta);
  }

  /** returns the latest meta data from the db */
  private async getMetaDataFromStorage() {
    return await this.metaStorage.get();
  }

  /** returns the meta data from the contract */
  private async getMetaDataFromContract(blockNumber: number | null) {
    const { provider } = this.registryContract;
    const block = await provider.getBlock(blockNumber ?? 'latest');
    const blockHash = block.hash;
    const blockTag = { blockHash };

    const [keysOpIndex, lastUnbufferedLog] = await Promise.all([
      this.metaFetch.fetchKeysOpIndex({ blockTag }),
      this.metaFetch.fetchLastUnbufferedLog(block.number),
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
     * we can collect key change events and fetch keys only for updated operators
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

        return await this.getKeysFromContract(
          operatorIndex,
          fromIndex,
          toIndex,
          blockHash,
        );
      }),
    );

    return keysByOperator.flat();
  }

  /** clears the db */
  clear() {
    // TODO
  }

  subscribe() {
    // TODO
  }

  getOperators() {
    // TODO
  }

  getKeys() {
    // TODO
  }
}
