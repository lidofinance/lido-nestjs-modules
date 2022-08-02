import { DomainType, Epoch, Root, Version } from '../ssz/primitive/types';
import { Fork, ForkData } from '../ssz';

/**
 * Return the domain for the [[domainType]] and [[forkVersion]].
 */
export function computeDomain(domainType: DomainType, forkVersion: Version, genesisValidatorRoot: Root): Uint8Array {
  const forkDataRoot = computeForkDataRoot(forkVersion, genesisValidatorRoot);
  const domain = new Uint8Array(32);
  domain.set(domainType, 0);
  domain.set(forkDataRoot.slice(0, 28), 4);
  return domain;
}

/**
 * Return the ForkVersion at an epoch from a Fork type
 */
export function getForkVersion(fork: Fork, epoch: Epoch): Version {
  return epoch < fork.epoch ? fork.previousVersion : fork.currentVersion;
}

/**
 * Used primarily in signature domains to avoid collisions across forks/chains.
 */
export function computeForkDataRoot(currentVersion: Version, genesisValidatorsRoot: Root): Uint8Array {
  const forkData: ForkData = {
    currentVersion,
    genesisValidatorsRoot,
  };
  return ForkData.hashTreeRoot(forkData);
}
