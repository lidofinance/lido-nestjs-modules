import { JsonRpcRequest } from '@lido-nestjs/execution';
import {
  calculatePayloadSize,
  extractHttpErrorCode,
  extractRpcErrorCode,
  getRequestKey,
  isRpcProviderWithEventEmitter,
  normalizeMethod,
  normalizeProvider,
} from '../src/rpc-metrics-prometheus.utils';

describe('rpc metrics utils', () => {
  test('isRpcProviderWithEventEmitter should validate shape', () => {
    expect(isRpcProviderWithEventEmitter(null)).toBe(false);
    expect(
      isRpcProviderWithEventEmitter({
        eventEmitter: {
          on: () => undefined,
        },
      }),
    ).toBe(false);

    expect(
      isRpcProviderWithEventEmitter({
        eventEmitter: {
          on: () => undefined,
          off: () => undefined,
        },
      }),
    ).toBe(true);
  });

  test('normalizeProvider should normalize domains and ip values', () => {
    expect(normalizeProvider('https://lb.drpc.org')).toBe('drpc.org');
    expect(normalizeProvider('eth-holesky.g.alchemy.com')).toBe('alchemy.com');
    expect(normalizeProvider('HTTP://MAINNET.QUICKNODE.COM')).toBe(
      'quicknode.com',
    );
    expect(normalizeProvider('http://192.168.0.1')).toBe('192.168.0.1');
    expect(normalizeProvider('http://192.168.0.1:8545')).toBe(
      '192.168.0.1:8545',
    );
    expect(normalizeProvider('example.org:443')).toBe('example.org');
    expect(normalizeProvider('localhost')).toBe('localhost');
    expect(normalizeProvider('http://:8545')).toBe('unknown');
    expect(normalizeProvider('')).toBe('unknown');
    expect(normalizeProvider('https://')).toBe('unknown');
  });

  test('extractHttpErrorCode should classify HTTP status codes', () => {
    expect(extractHttpErrorCode({ status: 429 })).toBe('4xx');
    expect(extractHttpErrorCode({ status: 500 })).toBe('5xx');
    expect(extractHttpErrorCode({ status: '502' })).toBe('5xx');
    expect(extractHttpErrorCode({ status: '403' })).toBe('4xx');
    expect(extractHttpErrorCode({ message: 'timeout' })).toBe('');
    expect(extractHttpErrorCode(null)).toBe('');
    expect(extractHttpErrorCode('error')).toBe('');
  });

  test('extractRpcErrorCode should extract numeric codes', () => {
    expect(extractRpcErrorCode({ code: -32603 })).toBe('-32603');
    expect(extractRpcErrorCode({ code: '-32000' })).toBe('-32000');
    expect(extractRpcErrorCode({ error: { code: -32010 } })).toBe('-32010');
    expect(extractRpcErrorCode({ code: 'SERVER_ERROR' })).toBe('');
    expect(extractRpcErrorCode({})).toBe('');
    expect(extractRpcErrorCode('text')).toBe('');
  });

  test('calculatePayloadSize should return byte size and handle failures', () => {
    expect(calculatePayloadSize({ foo: 'bar' })).toBeGreaterThan(0);

    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(calculatePayloadSize(circular)).toBe(0);
  });

  test('getRequestKey should combine request ids', () => {
    const requests: JsonRpcRequest[] = [
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [],
      },
      {
        id: 42,
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
      },
    ];

    expect(getRequestKey(requests)).toBe('1,42');
  });

  test('normalizeMethod should fallback to unknown', () => {
    expect(normalizeMethod('eth_call')).toBe('eth_call');
    expect(normalizeMethod('')).toBe('unknown');
    expect(normalizeMethod(10)).toBe('unknown');
  });
});
