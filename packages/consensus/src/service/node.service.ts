import { ConsensusMethod } from '../interfaces';
import { ConsensusBaseService } from './base.service';

export class ConsensusNodeService extends ConsensusBaseService {
  /** Retrieves data about the node's network presence */
  public getNetworkIdentity: ConsensusMethod<'getNetworkIdentity'> =
    async function (args) {
      const { options } = args || {};
      return await this.fetch(`/eth/v1/node/identity`, options);
    };

  /** Retrieves data about the node's network peers. By default this returns all peers. Multiple query params are combined using AND conditions */
  public getPeers: ConsensusMethod<'getPeers'> = async function (args) {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/peers`, options);
  };

  /** Retrieves data about the given peer */
  public getPeer: ConsensusMethod<'getPeer'> = async function (args) {
    const { peerId, options } = args || {};
    return await this.fetch(`/eth/v1/node/peers/${peerId}`, options);
  };

  /** Retrieves number of known peers. */
  public getPeerCount: ConsensusMethod<'getPeerCount'> = async function (args) {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/peer_count`, options);
  };

  /** Requests that the beacon node identify information about its implementation in a format similar to a [HTTP User-Agent](https://tools.ietf.org/html/rfc7231#section-5.5.3) field. */
  public getNodeVersion: ConsensusMethod<'getNodeVersion'> = async function (
    args,
  ) {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/version`, options);
  };

  /** Requests the beacon node to describe if it's currently syncing or not, and if it is, what block it is up to. */
  public getSyncingStatus: ConsensusMethod<'getSyncingStatus'> =
    async function (args) {
      const { options } = args || {};
      return await this.fetch(`/eth/v1/node/syncing`, options);
    };

  /** Returns node health status in http status codes. Useful for load balancers. */
  public getHealth: ConsensusMethod<'getHealth'> = async function (args) {
    const { options } = args || {};
    return await this.fetch(`/eth/v1/node/health`, options);
  };
}
