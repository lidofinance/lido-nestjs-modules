import { RegistryOperator } from '../../storage/operator.entity';
import { compareUsedMeta } from '../../utils/meta.utils';
import { AbstractService } from '../abstract';

export class ValidatorRegistryService extends AbstractService {
  public getLastKey(prevOperator: RegistryOperator) {
    return prevOperator.usedSigningKeys;
  }
  public compareMeta = compareUsedMeta;
}
