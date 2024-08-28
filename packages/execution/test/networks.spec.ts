/* eslint-disable @typescript-eslint/no-explicit-any */
import { Network } from '@ethersproject/networks';
import {
  networksEqual,
  getNetworkChain,
  getConnectionFQDN,
} from '../src/common/networks';
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

  test('should correctly get network FQDN from url', () => {
    const checks = [
      {
        value: 'https://test.com/test?param1=foo&param2=bar',
        expected: 'test.com',
      },
      {
        value: { url: 'https://test.com/test?param1=foo&param2=bar' },
        expected: 'test.com',
      },
      {
        value: 'http://subdomain.test.com/test?param1=foo&param2=bar',
        expected: 'subdomain.test.com',
      },
      {
        value:
          'http://subdomain2.subdomain.test.com/test?param1=foo&param2=bar',
        expected: 'subdomain2.subdomain.test.com',
      },
      {
        value: 'http://www.test.com/test?param1=foo&param2=bar',
        expected: 'www.test.com',
      },
      {
        value: 'http://www.test.com:80/test?param1=foo&param2=bar',
        expected: 'www.test.com',
      },
      {
        value: 'http://192.168.234.2/test?param1=foo&param2=bar',
        expected: '192.168.234.2',
      },
      {
        value: 'http://192.168.234.2:80/test?param1=foo&param2=bar',
        expected: '192.168.234.2',
      },
      {
        value: 'http://test?param1=foo&param2=bar',
        expected: '',
      },
      {
        value: 'http://?param1=foo&param2=bar',
        expected: '',
      },
      {
        value: '',
        expected: '',
      },
      {
        value: '192.168.4.3',
        expected: '192.168.4.3',
      },
      {
        value: '192.168.4.3:256',
        expected: '192.168.4.3',
      },
    ];

    checks.forEach((check) => {
      expect(getConnectionFQDN(check.value)).toBe(check.expected);
    });
  });
});
