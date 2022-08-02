import { Type } from '@chainsafe/ssz';
import { SigningData } from '../ssz';
import { Domain } from '../ssz/primitive/types';

/**
 * Return the signing root of an object by calculating the root of the object-domain tree.
 */
export function computeSigningRoot<T>(type: Type<T>, sszObject: T, domain: Domain): Uint8Array {
  const domainWrappedObject: SigningData = {
    objectRoot: type.hashTreeRoot(sszObject),
    domain,
  };
  return SigningData.hashTreeRoot(domainWrappedObject);
}
