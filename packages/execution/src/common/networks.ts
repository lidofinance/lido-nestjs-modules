import { Network } from '@ethersproject/networks';
import { Networkish } from '../interfaces/networkish';
import { ConnectionInfo } from '@ethersproject/web';

const IP_V4_REGEX = new RegExp(
  /^(?<domain>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(?<port>\d+))?/i,
);

const DOMAIN_REGEX = new RegExp(
  /^(?<protocol>https?:\/\/)(?=(?<fqdn>[^:/]+))(?:(?<service>www|ww\d|cdn|ftp|mail|pop\d?|ns\d?|git)\.)?(?:(?<subdomain>[^:/]+)\.)*(?<domain>[^:/]+\.[a-z0-9]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?/i,
);

export const networksEqual = (
  networkA: Network,
  networkB: Network,
): boolean => {
  return (
    networkA.name === networkB.name &&
    networkA.chainId === networkB.chainId &&
    (networkA.ensAddress === networkB.ensAddress ||
      (!networkA.ensAddress && !networkB.ensAddress))
  );
};

export const getNetworkChain = (networkish: Networkish): number =>
  typeof networkish === 'object' && networkish != null
    ? networkish.chainId
    : networkish;

export const networksChainsEqual = (
  networkA: Network,
  networkB: Networkish,
): boolean => networkA.chainId === getNetworkChain(networkB);

export const getConnectionFQDN = (
  connectionInfo: ConnectionInfo | string,
): string => {
  const urlLike =
    typeof connectionInfo === 'string' ? connectionInfo : connectionInfo.url;

  const ipGroups = urlLike.match(IP_V4_REGEX)?.groups;

  if (ipGroups) {
    /* istanbul ignore next */
    return ipGroups.domain ?? '';
  }

  const groups = urlLike.match(DOMAIN_REGEX)?.groups;

  /* istanbul ignore next */
  return groups?.fqdn ?? '';
};
