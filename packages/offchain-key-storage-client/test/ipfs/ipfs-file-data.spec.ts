import { isIpfsFileData } from '../../src';

describe('check IpfsFileData', () => {
  test('successful', () => {
    const param: unknown = {
      Hash: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
    };

    expect(isIpfsFileData(param)).toBe(true);
  });

  test('wrong type', () => {
    const param: unknown = {
      Hash: 5,
    };

    expect(isIpfsFileData(param)).toBe(false);
  });

  test('absence of hash', () => {
    expect(isIpfsFileData({})).toBe(false);
    expect(isIpfsFileData({ Hash: null })).toBe(false);
    expect(isIpfsFileData(undefined)).toBe(false);
  });
});
