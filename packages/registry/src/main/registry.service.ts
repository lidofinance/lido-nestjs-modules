import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Registry, REGISTRY_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { RegistryMetaFetchService } from '../fetch/meta.fetch';
import { RegistryKeyFetchService } from '../fetch/key.fetch';
import { RegistryOperatorFetchService } from '../fetch/operator.fetch';
import { RegistryMetaStorageService } from '../storage/meta.storage';
import { RegistryKeyStorageService } from '../storage/key.storage';
import { RegistryOperatorStorageService } from '../storage/operator.storage';
import { LOGGER_PROVIDER } from '@lido-nestjs/logger';

@Injectable()
export class RegistryService {
  constructor(
    @Inject(REGISTRY_CONTRACT_TOKEN)
    private registryContract: Registry,

    @Inject(LOGGER_PROVIDER)
    private logger: LoggerService,

    private readonly metaFetch: RegistryMetaFetchService,
    private readonly metaStorage: RegistryMetaStorageService,

    private readonly keyFetch: RegistryKeyFetchService,
    private readonly keyStorage: RegistryKeyStorageService,

    private readonly operatorFetch: RegistryOperatorFetchService,
    private readonly operatorStorage: RegistryOperatorStorageService,
  ) {}

  /** collects changed data from the contract and store it to the db */
  async update(blockNumber: number | null = null) {
    const previousData = await this.getMetaDataFromStorage();
    const currentData = await this.getMetaDataFromContract(blockNumber);

    this.logger.log('Collected metadata', { previousData, currentData });

    if (!previousData) {
      // TODO: wrap with transaction
      // TODO: update operators
      // TODO: update keys
      // TODO: log
      await this.metaStorage.save(currentData);
      return;
    }

    if (previousData.blockNumber > currentData.blockNumber) {
      this.logger.warn('Previous data is newer than current data');
      return;
    }
  }

  private async getOperatorsFromContract() {
    // TODO
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
