import {
  ConsensusMethodArgs,
  ConsensusMethodResult,
} from '../interfaces/consensus.interface';
import { ConsensusBaseService } from './base.service';

export class ConsensusDebugService extends ConsensusBaseService {
  /** Returns full BeaconState object for given stateId. */
  public async getStateV2(
    args: ConsensusMethodArgs<'getStateV2'>,
  ): ConsensusMethodResult<'getStateV2'> {
    const { stateId, options } = args;
    return await this.fetch(`/eth/v2/debug/beacon/states/${stateId}`, options);
  }

  /** Retrieves all possible chain heads (leaves of fork choice tree). */
  public async getDebugChainHeadsV2(
    args?: ConsensusMethodArgs<'getDebugChainHeadsV2'>,
  ): ConsensusMethodResult<'getDebugChainHeadsV2'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v2/debug/beacon/heads`, options);
  }

  /** Retrieves all current fork choice context. From the Gloas fork on each node also has a payload status. */
  public async getDebugForkChoiceV2(
    args?: ConsensusMethodArgs<'getDebugForkChoiceV2'>,
  ): ConsensusMethodResult<'getDebugForkChoiceV2'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v2/debug/fork_choice`, options);
  }
}
