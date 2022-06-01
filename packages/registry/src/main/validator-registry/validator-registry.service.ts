import { RegistryOperator } from '../../storage/operator.entity';
import { AbstractRegistryService } from '../abstract-registry';

export class ValidatorRegistryService extends AbstractRegistryService {
  public getToIndex(currOperator: RegistryOperator) {
    return currOperator.usedSigningKeys;
  }

  public async getMetaDataFromContract(blockHashOrBlockTag: string | number) {
    const { provider } = this.registryContract;
    const block = await provider.getBlock(blockHashOrBlockTag);
    const blockHash = block.hash;

    const lastUnbufferedLog = await this.metaFetch.fetchLastUnbufferedLog(
      block,
    );

    const unbufferedBlockNumber = lastUnbufferedLog.blockNumber;

    return {
      blockNumber: block.number,
      blockHash,
      unbufferedBlockNumber,
      timestamp: block.timestamp,
    };
  }
}
