import { hexValue, isHexString } from '@ethersproject/bytes';

export const formatBlockNumber = (
  blockNumber: string | null | number | undefined,
) => {
  if (
    blockNumber === 'latest' ||
    blockNumber === 'earliest' ||
    blockNumber === 'pending'
  ) {
    return blockNumber;
  } else if (
    blockNumber !== null &&
    typeof blockNumber !== 'undefined' &&
    (typeof blockNumber === 'number' || isHexString(blockNumber))
  ) {
    return hexValue(blockNumber);
  }

  return 'latest';
};
