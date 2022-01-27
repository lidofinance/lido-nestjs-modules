import {
  ConsensusMethodArgs,
  ConsensusMethodResult,
} from '../interfaces/consensus.interface';
import { ConsensusBaseService } from './base.service';

export class ConsensusConfigService extends ConsensusBaseService {
  /** Retrieve all forks, past present and future, of which this node is aware. */
  public async getForkSchedule(
    args?: ConsensusMethodArgs<'getForkSchedule'>,
  ): ConsensusMethodResult<'getForkSchedule'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/config/fork_schedule`, options);
  }

  /** Retrieve specification configuration used on this node. */
  public async getSpec(
    args?: ConsensusMethodArgs<'getSpec'>,
  ): ConsensusMethodResult<'getSpec'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/config/spec`, options);
  }

  /** Retrieve Eth1 deposit contract address and chain ID. */
  public async getDepositContract(
    args?: ConsensusMethodArgs<'getDepositContract'>,
  ): ConsensusMethodResult<'getDepositContract'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/config/deposit_contract`, options);
  }
}
