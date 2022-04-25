import { hexValue, isHexString } from '@ethersproject/bytes';

export const formatBlockNumber = (blockNumber: string | null | number) => {
  if (
    blockNumber === 'latest' ||
    blockNumber === 'earliest' ||
    blockNumber === 'pending'
  ) {
    return blockNumber;
  } else if (
    blockNumber &&
    (typeof blockNumber === 'number' || isHexString(blockNumber))
  ) {
    return hexValue(blockNumber);
  }

  return 'latest';
};
