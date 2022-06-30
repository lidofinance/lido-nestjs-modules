import { ForkData } from '../ssz';
import { DomainType, Root, Version } from '../ssz/primitive/types';

/**
 * Used primarily in signature domains to avoid collisions across forks/chains.
 */
export function computeForkDataRoot(
  currentVersion: Version,
  genesisValidatorsRoot: Root,
): Uint8Array {
  const forkData: ForkData = {
    currentVersion,
    genesisValidatorsRoot,
  };
  return ForkData.hashTreeRoot(forkData);
}

export function computeDomain(
  domainType: DomainType,
  forkVersion: Version,
  genesisValidatorRoot: Root,
): Uint8Array {
  const forkDataRoot = computeForkDataRoot(forkVersion, genesisValidatorRoot);
  const domain = new Uint8Array(32);
  domain.set(domainType, 0);
  domain.set(forkDataRoot.slice(0, 28), 4);
  return domain;
}
