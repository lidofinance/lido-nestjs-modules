import { ConsensusMethod } from '../interfaces';
import { ConsensusBaseService } from './base.service';

export class ConsensusConfigService extends ConsensusBaseService {
  /** Retrieve all forks, past present and future, of which this node is aware. */
  public getForkSchedule: ConsensusMethod<'getForkSchedule'> = async function (
    args,
  ) {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/config/fork_schedule`, options);
  };

  /** Retrieve specification configuration used on this node. */
  public getSpec: ConsensusMethod<'getSpec'> = async function (args) {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/config/spec`, options);
  };

  /** Retrieve Eth1 deposit contract address and chain ID. */
  public getDepositContract: ConsensusMethod<'getDepositContract'> =
    async function (args) {
      const { options } = args || {};
      return await this.fetch(`/eth/v1/config/deposit_contract`, options);
    };
}
