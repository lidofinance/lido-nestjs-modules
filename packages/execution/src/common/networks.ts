import { Network } from '@ethersproject/networks';
import { Networkish } from '../interfaces/networkish';

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
