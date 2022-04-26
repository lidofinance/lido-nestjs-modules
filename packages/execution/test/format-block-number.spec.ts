import { formatBlockNumber } from '../src/ethers/format-block-number';

describe('format block number', () => {
  test('should work with null', () => {
    expect(formatBlockNumber(null)).toBe('latest');
  });

  test('should work with undefined', () => {
    expect(formatBlockNumber(undefined)).toBe('latest');
  });

  test('should work with 0', () => {
    expect(formatBlockNumber(0)).toBe('0x0');
  });

  test('should work with block tag', () => {
    expect(formatBlockNumber('latest')).toBe('latest');
    expect(formatBlockNumber('earliest')).toBe('earliest');
    expect(formatBlockNumber('pending')).toBe('pending');
  });

  test('should work with number', () => {
    expect(formatBlockNumber(1000)).toBe('0x3e8');
  });

  test('should work with hexed string', () => {
    expect(formatBlockNumber('0x4F77')).toBe('0x4f77');
    expect(formatBlockNumber('0x4f77')).toBe('0x4f77');
  });
});
