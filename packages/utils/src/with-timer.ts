import { performance } from 'perf_hooks';

export const withTimer = async <T>(
  callback: () => Promise<T>,
): Promise<[T, number]> => {
  const timeStartMs = performance.now();
  const result = await callback();
  const timeEndMs = performance.now();
  const timeSeconds = Math.ceil(timeEndMs - timeStartMs) / 1000;

  return [result, timeSeconds];
};
