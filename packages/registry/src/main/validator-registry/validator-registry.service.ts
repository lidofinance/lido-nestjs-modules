import { RegistryOperator } from '../../storage/operator.entity';
import { compareUsedMeta } from '../../utils/meta.utils';
import { AbstractService } from '../abstract';

export class ValidatorRegistryService extends AbstractService {
  public getLastKey(prevOperator: RegistryOperator) {
    return prevOperator.totalSigningKeys;
  }
  public compareMeta = compareUsedMeta;

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
    };
  }
}
