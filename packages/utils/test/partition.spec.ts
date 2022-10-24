import { partition } from '../src';

describe('partition', () => {
  test('should work for empty array', async () => {
    const res = partition([], 4, 1);

    expect(res).toBeInstanceOf(Array);
    expect(res.length).toBe(0);
  });

  test('should work when there are few elements only for one partition', async () => {
    const res = partition([1, 2, 3, 4], 4, 1);

    expect(res).toBeInstanceOf(Array);
    expect(res.length).toBe(4);
    expect(res[0].length).toBe(1);
    expect(res[0]).toEqual([1]);
    expect(res[1]).toEqual([2]);
    expect(res[2]).toEqual([3]);
    expect(res[3]).toEqual([4]);
  });

  test('should work for more elements enough for multiple partitions', async () => {
    const res = partition([1, 2, 3, 4], 2, 2);

    expect(res).toBeInstanceOf(Array);
    expect(res.length).toBe(2);
    expect(res[0].length).toBe(2);
    expect(res[1].length).toBe(2);
    expect(res[0]).toEqual([1, 2]);
    expect(res[1]).toEqual([3, 4]);
  });

  test('should work for small number of elements', async () => {
    const res = partition([1, 2, 3, 4], 8, 4);

    expect(res).toBeInstanceOf(Array);
    expect(res.length).toBe(1);
    expect(res[0].length).toBe(4);
    expect(res[0]).toEqual([1, 2, 3, 4]);
  });

  test('should work for few elements', async () => {
    const res = partition([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 5, 2);

    expect(res).toBeInstanceOf(Array);
    expect(res.length).toBe(6);
    expect(res[0].length).toBe(2);
    expect(res[0]).toEqual([1, 2]);
    expect(res[1]).toEqual([3, 4]);
    expect(res[5]).toEqual([11, 12]);
  });
});
