import { chunk } from '../src';

describe('chunk', () => {
  test('empty array', () => {
    const result = chunk([], 100);
    expect(result).toEqual([]);
  });

  test('split by two', () => {
    const result = chunk([1, 2], 1);
    expect(result).toEqual([[1], [2]]);
  });

  test('negative chunk size', () => {
    const result = chunk([1, 2], -1);
    expect(result).toEqual([]);
  });

  test('chunk count greater than array length', () => {
    const result = chunk([1, 2], 100);
    expect(result).toEqual([[1, 2]]);
  });
});
