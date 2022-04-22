import { RegistryMeta } from '../storage/meta.entity';

export const compareMeta = (
  metaOne: RegistryMeta | null,
  metaTwo: RegistryMeta | null,
): boolean => {
  if (metaOne == null) return false;
  if (metaTwo == null) return false;

  const keyOpIndexOne = metaOne?.keysOpIndex;
  const keyOpIndexTwo = metaTwo?.keysOpIndex;

  if (keyOpIndexOne !== keyOpIndexTwo) return false;

  const unbufferedBlockOne = metaOne?.unbufferedBlockNumber;
  const unbufferedBlockTwo = metaTwo?.unbufferedBlockNumber;

  if (unbufferedBlockOne !== unbufferedBlockTwo) return false;

  return true;
};
