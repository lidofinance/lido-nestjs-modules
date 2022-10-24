import { Type } from '@chainsafe/ssz';
import { Domain } from '../ssz/primitive/types';
import { SigningData } from '../ssz';

export const computeSigningRoot = <T>(
  type: Type<T>,
  sszObject: T,
  domain: Domain,
): Uint8Array => {
  const domainWrappedObject: SigningData = {
    objectRoot: type.hashTreeRoot(sszObject),
    domain,
  };
  return SigningData.hashTreeRoot(domainWrappedObject);
};
