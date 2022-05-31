import { compareAllMeta } from '../../src/utils/meta.utils';

describe('Compare meta util', () => {
  const metaOne = {
    blockNumber: 1,
    blockHash: '0x01',
    keysOpIndex: 1,
    unbufferedBlockNumber: 1,
    timestamp: 1,
  };

  const metaTwo = {
    blockNumber: 2,
    blockHash: '0x02',
    keysOpIndex: 2,
    unbufferedBlockNumber: 2,
    timestamp: 2,
  };

  test('null - null', async () => {
    expect(compareAllMeta(null, null)).toBe(false);
  });

  test('null - meta', async () => {
    expect(compareAllMeta(null, metaOne)).toBe(false);
  });

  test('meta - null', async () => {
    expect(compareAllMeta(metaOne, null)).toBe(false);
  });

  test('meta - another meta', async () => {
    expect(compareAllMeta(metaOne, metaTwo)).toBe(false);
  });

  test('meta - partial same meta', async () => {
    const partialMeta = {
      ...metaOne,
      unbufferedBlockNumber: metaTwo.unbufferedBlockNumber,
    };

    expect(compareAllMeta(metaOne, partialMeta)).toBe(false);
  });

  test('meta - same meta', async () => {
    expect(compareAllMeta(metaOne, metaOne)).toBe(true);
    expect(compareAllMeta(metaTwo, metaTwo)).toBe(true);
  });
});
