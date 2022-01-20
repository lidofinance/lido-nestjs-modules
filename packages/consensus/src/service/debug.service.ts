import { ConsensusMethod } from '../interfaces';
import { ConsensusBaseService } from './base.service';

export class ConsensusDebugService extends ConsensusBaseService {
  /** Returns full BeaconState object for given stateId. */
  public getState: ConsensusMethod<'getState'> = async function (args) {
    const { stateId, options } = args || {};
    return await this.fetch(`/eth/v1/debug/beacon/states/${stateId}`, options);
  };

  /** Returns full BeaconState object for given stateId. */
  public getStateV2: ConsensusMethod<'getStateV2'> = async function (args) {
    const { stateId, options } = args || {};
    return await this.fetch(`/eth/v2/debug/beacon/states/${stateId}`, options);
  };

  /** Retrieves all possible chain heads (leaves of fork choice tree). */
  public getDebugChainHeads: ConsensusMethod<'getDebugChainHeads'> =
    async function (args) {
      const { options } = args || {};
      return await this.fetch(`/eth/v2/debug/beacon/heads`, options);
    };
}
