/* eslint-disable @typescript-eslint/no-explicit-any */
import { Network } from '@ethersproject/networks';
import { networksEqual, getNetworkChain } from '../src/common/networks';
import { Networkish } from '../src/interfaces/networkish';

describe('Networks. ', () => {
  test('should be not equal when networks with different chainId', () => {
    const networkA: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: '0x22',
    };

    const networkB: Network = {
      chainId: 2,
      name: 'A',
      ensAddress: '0x22',
    };

    expect(networksEqual(networkA, networkB)).toBe(false);
    expect(networksEqual(networkB, networkA)).toBe(false);
  });

  test('should be not equal when networks with different name', () => {
    const networkA: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: '0x22',
    };

    const networkB: Network = {
      chainId: 1,
      name: 'B',
      ensAddress: '0x22',
    };

    expect(networksEqual(networkA, networkB)).toBe(false);
    expect(networksEqual(networkB, networkA)).toBe(false);
  });

  test('should be not equal when networks with different ENS', () => {
    const networkA: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: '0x22',
    };

    const networkB: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: '0x42',
    };

    expect(networksEqual(networkA, networkB)).toBe(false);
    expect(networksEqual(networkB, networkA)).toBe(false);
  });

  test('should be equal when networks with undefined ENS', () => {
    const networkA: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: undefined,
    };

    const networkB: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: undefined,
    };

    expect(networksEqual(networkA, networkB)).toBe(true);
    expect(networksEqual(networkB, networkA)).toBe(true);
  });

  test('should be equal when networks with null ENS', () => {
    const networkA: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: <any>null,
    };

    const networkB: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: <any>null,
    };

    expect(networksEqual(networkA, networkB)).toBe(true);
    expect(networksEqual(networkB, networkA)).toBe(true);
  });

  test('should be not equal when networks with different ENS', () => {
    const networkA: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: undefined,
    };

    const networkB: Network = {
      chainId: 1,
      name: 'A',
      ensAddress: '0x42',
    };

    expect(networksEqual(networkA, networkB)).toBe(false);
    expect(networksEqual(networkB, networkA)).toBe(false);
  });

  test('should correctly get chainId from Networkish or just plain chainId', () => {
    const network: Networkish = {
      chainId: 1,
      name: 'A',
    };

    expect(getNetworkChain(network)).toBe(1);
    expect(getNetworkChain(1)).toBe(1);
  });
});
