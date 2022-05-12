import { RegistryMeta } from '../storage/meta.entity';

const compareOpIndex = (
  metaOne: RegistryMeta | null,
  metaTwo: RegistryMeta | null,
): boolean => {
  if (metaOne == null) return false;
  if (metaTwo == null) return false;

  const keysOpIndexOne = metaOne.keysOpIndex;
  const keysOpIndexTwo = metaTwo.keysOpIndex;

  return keysOpIndexOne === keysOpIndexTwo;
};

const compareUnbufferedBlockNumber = (
  metaOne: RegistryMeta | null,
  metaTwo: RegistryMeta | null,
): boolean => {
  if (metaOne == null) return false;
  if (metaTwo == null) return false;

  const unbufferedBlockOne = metaOne.unbufferedBlockNumber;
  const unbufferedBlockTwo = metaTwo.unbufferedBlockNumber;

  return unbufferedBlockOne === unbufferedBlockTwo;
};

export const compareAllMeta = (
  metaOne: RegistryMeta | null,
  metaTwo: RegistryMeta | null,
): boolean => {
  if (metaOne == null) return false;
  if (metaTwo == null) return false;

  return (
    compareOpIndex(metaOne, metaTwo) &&
    compareUnbufferedBlockNumber(metaOne, metaTwo)
  );
};

export const compareUsedMeta = (
  metaOne: RegistryMeta | null,
  metaTwo: RegistryMeta | null,
): boolean => {
  if (metaOne == null) return false;
  if (metaTwo == null) return false;

  return compareUnbufferedBlockNumber(metaOne, metaTwo);
};
