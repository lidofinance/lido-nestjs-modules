/**
 * Slits array into partitions (chunks) with maxChunkSize and maxParts arguments.
 * Does not modify existing array.
 */
export const partition = <T>(
  arr: T[],
  maxParts: number,
  minChunkSize: number,
): T[][] => {
  const parts = Math.floor(maxParts);
  const calculatedChunkSize =
    arr.length >= parts ? Math.floor(arr.length / parts) : arr.length;
  const chunkSize =
    calculatedChunkSize < minChunkSize ? minChunkSize : calculatedChunkSize;

  const acc: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    acc.push(arr.slice(i, i + chunkSize));
  }

  return acc;
};
