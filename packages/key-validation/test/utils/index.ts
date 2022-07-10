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

function* positiveIterator(start: number, end: number) {
  for (let i = start; i < end; i++) yield i;
}

function* negativeIterator(start: number, end: number) {
  for (let i = start; i > end; i--) yield i;
}

export const range = (start: number, end: number) => {
  const delta = start - end;
  const iterator = delta < 0 ? positiveIterator : negativeIterator;

  return [...iterator(start, end)];
};
