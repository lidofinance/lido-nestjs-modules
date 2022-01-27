import {
  ConsensusMethodArgs,
  ConsensusMethodResult,
} from '../interfaces/consensus.interface';
import { ConsensusBaseService } from './base.service';

export class ConsensusNodeService extends ConsensusBaseService {
  /** Retrieves data about the node's network presence */
  public async getNetworkIdentity(
    args?: ConsensusMethodArgs<'getNetworkIdentity'>,
  ): ConsensusMethodResult<'getNetworkIdentity'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/identity`, options);
  }

  /** Retrieves data about the node's network peers. By default this returns all peers. Multiple query params are combined using AND conditions */
  public async getPeers(
    args?: ConsensusMethodArgs<'getPeers'>,
  ): ConsensusMethodResult<'getPeers'> {
    const { options, state, direction } = args || {};
    const search = this.getSearchString({ state, direction });
    return await this.fetch(`/eth/v1/node/peers${search}`, options);
  }

  /** Retrieves data about the given peer */
  public async getPeer(
    args: ConsensusMethodArgs<'getPeer'>,
  ): ConsensusMethodResult<'getPeer'> {
    const { peerId, options } = args;
    return await this.fetch(`/eth/v1/node/peers/${peerId}`, options);
  }

  /** Retrieves number of known peers. */
  public async getPeerCount(
    args?: ConsensusMethodArgs<'getPeerCount'>,
  ): ConsensusMethodResult<'getPeerCount'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/peer_count`, options);
  }

  /** Requests that the beacon node identify information about its implementation in a format similar to a [HTTP User-Agent](https://tools.ietf.org/html/rfc7231#section-5.5.3) field. */
  public async getNodeVersion(
    args?: ConsensusMethodArgs<'getNodeVersion'>,
  ): ConsensusMethodResult<'getNodeVersion'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/version`, options);
  }

  /** Requests the beacon node to describe if it's currently syncing or not, and if it is, what block it is up to. */
  public async getSyncingStatus(
    args?: ConsensusMethodArgs<'getSyncingStatus'>,
  ): ConsensusMethodResult<'getSyncingStatus'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/syncing`, options);
  }

  /** Returns node health status in http status codes. Useful for load balancers. */
  public async getHealth(
    args?: ConsensusMethodArgs<'getHealth'>,
  ): ConsensusMethodResult<'getHealth'> {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/health`, options);
  }
}
