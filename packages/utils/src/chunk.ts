export const chunk = <D>(array: Array<D>, chunkSize: number) => {
  if (chunkSize <= 0) return [];
  const result = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};
