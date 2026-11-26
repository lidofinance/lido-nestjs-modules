/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConnectionInfo, fetchJson } from '@ethersproject/web';
import * as getUrlModule from '@ethersproject/web/lib/geturl';
import { LoggerService } from '@nestjs/common';
import {
  AllProvidersFailedError,
  ExtendedJsonRpcBatchProvider,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import * as redactUrlModule from '../src/common/redact-url';
import { redactUrl } from '../src/common/redact-url';
import { sanitizeError } from '../src/common/sanitize-error';
import { findPiece, secretEndpoints } from './fixtures/secret-endpoints';

type GetUrlResponse = Awaited<ReturnType<typeof getUrlModule.getUrl>>;

const ADDRESS = '0x' + '11'.repeat(20);

const response = (statusCode: number, body: string): GetUrlResponse => ({
  statusCode,
  statusMessage: 'status',
  headers: { 'content-type': 'application/json' },
  body: new Uint8Array(Buffer.from(body)),
});

// eth_chainId answers 0x1, everything else gets `fail`
const mockGetUrl = (fail: () => Promise<GetUrlResponse>) =>
  jest
    .spyOn(getUrlModule, 'getUrl')
    .mockImplementation(async (_href, options) => {
      const body = JSON.parse(Buffer.from(options?.body ?? []).toString());
      const requests = Array.isArray(body) ? body : [body];
      if (requests.every((r: any) => r.method === 'eth_chainId')) {
        const result = requests.map((r: any) => ({
          jsonrpc: '2.0',
          id: r.id,
          result: '0x1',
        }));
        return response(200, JSON.stringify(result));
      }
      return fail();
    });

// every own string of the error and nested objects, incl. message and stack
const collectStrings = (node: unknown, seen = new Set<unknown>()): string => {
  if (node === null || typeof node !== 'object' || seen.has(node)) return '';
  seen.add(node);
  return Object.getOwnPropertyNames(node)
    .map((key) => {
      const value = (node as any)[key];
      return typeof value === 'string' ? value : collectStrings(value, seen);
    })
    .join('\n');
};

const expectClean = (error: any, url: string, key: string) => {
  const text = collectStrings(error);
  expect(findPiece(text, key)).toBeUndefined();
  expect(text).toContain(redactUrl(url));
};

const createProvider = (connection: string | ConnectionInfo) => {
  const provider = new ExtendedJsonRpcBatchProvider(connection, 1, {
    jsonRpcMaxBatchSize: 1,
    maxConcurrentRequests: 200,
    batchAggregationWaitMs: 1,
  });
  const events: any[] = [];
  provider.eventEmitter.on('rpc', (event) => events.push(event));
  return { provider, events };
};

const catchError = async (promise: Promise<unknown>): Promise<any> => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected a rejection');
};

// every row has 4 items: a shorter row makes jest pass `done` as the last arg
const failures: [string, () => Promise<GetUrlResponse>, string, number][] = [
  [
    'bad response',
    async () => response(500, 'internal error'),
    'bad response',
    0,
  ],
  [
    'invalid JSON',
    async () => response(200, 'not json'),
    'processing response error',
    0,
  ],
  [
    'missing response',
    () => Promise.reject(new Error('socket hang up')),
    'missing response',
    0,
  ],
  ['timeout', () => new Promise(() => undefined), 'timeout', 50],
];

describe('Execution module. Endpoint URL in errors', () => {
  afterEach(() => jest.restoreAllMocks());

  describe.each(secretEndpoints)('%s', (_, url, key) => {
    test.each(failures)(
      '%s: error and rpc event are clean',
      async (_case, fail, reason, timeout) => {
        mockGetUrl(fail);
        const { provider, events } = createProvider(
          timeout ? { url, timeout } : url,
        );

        const error = await catchError(provider.send('eth_blockNumber', []));

        expect(error.reason).toBe(reason);
        expect(error.code).toBe(
          reason === 'timeout' ? 'TIMEOUT' : 'SERVER_ERROR',
        );
        expect(error.url).toBe(redactUrl(url));
        expectClean(error, url, key);

        const event = events.find(
          (e) => e.action === 'provider:response-batched:error',
        );
        expect(event.error).toBe(error);
      },
    );

    test('call(): CALL_EXCEPTION from checkError is clean', async () => {
      mockGetUrl(async () => response(500, 'internal error'));
      const { provider } = createProvider(url);

      const error = await catchError(
        provider.call({ to: ADDRESS, data: '0x1234' }),
      );

      expect(error.code).toBe('CALL_EXCEPTION');
      expect(error.error.code).toBe('SERVER_ERROR');
      expect(error.error.reason).toBe('bad response');
      expectClean(error, url, key);
    });

    test('estimateGas(): INSUFFICIENT_FUNDS from checkError is clean', async () => {
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32000, message: 'insufficient funds for gas' },
      });
      mockGetUrl(async () => response(500, body));
      const { provider } = createProvider(url);

      const error = await catchError(
        provider.estimateGas({ from: ADDRESS, to: ADDRESS, value: 1 }),
      );

      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.error.body).toBe(body);
      expectClean(error, url, key);
    });

    test('cut of sanitizeError never holds a piece of the key', async () => {
      mockGetUrl(async () => response(500, 'internal error'));
      const { provider } = createProvider(url);

      // move the 1000-char cut across the place where the URL sits
      const errors = await Promise.all(
        Array.from({ length: 121 }, (_, size) =>
          catchError(
            provider.call({ to: ADDRESS, data: '0x' + 'ab'.repeat(size) }),
          ),
        ),
      );

      for (const error of errors) {
        expect(findPiece(sanitizeError(error), key)).toBeUndefined();
      }
    });
  });

  test('without the fix the same sweep leaks a cut key (control)', async () => {
    const [, url, key] = secretEndpoints[2];
    jest
      .spyOn(redactUrlModule, 'redactConnectionSecrets')
      .mockImplementation((error) => error);
    mockGetUrl(async () => response(500, 'internal error'));
    const { provider } = createProvider(url);

    const errors = await Promise.all(
      Array.from({ length: 121 }, (_, size) =>
        catchError(
          provider.call({ to: ADDRESS, data: '0x' + 'ab'.repeat(size) }),
        ),
      ),
    );

    const cut = errors
      .map((error) => sanitizeError(error))
      .filter((text) => !text.includes(key) && findPiece(text, key));
    expect(cut.length).toBeGreaterThan(0);
  });

  test('host-only secret URL: no piece of the first label leaks', async () => {
    const url =
      'http://abc123def456-rpc-3-mainnet-erigon.tooling-nodes.example.fi';
    const label = new URL(url).hostname.split('.')[0];
    mockGetUrl(async () => response(500, 'internal error'));
    const { provider } = createProvider(url);

    const errors = await Promise.all(
      Array.from({ length: 121 }, (_, size) =>
        catchError(
          provider.call({ to: ADDRESS, data: '0x' + 'ab'.repeat(size) }),
        ),
      ),
    );

    for (const error of errors) {
      expect(collectStrings(error)).toContain('http://***.example.fi');
      expect(findPiece(collectStrings(error), label)).toBeUndefined();
      expect(findPiece(sanitizeError(error), label)).toBeUndefined();
    }
  });

  test('synchronous throw from fetchJson is caught and cleaned', async () => {
    const [, url, key] = secretEndpoints[0];
    const insecure = url.replace('https:', 'http:');
    const connection = {
      url: insecure,
      user: 'alice',
      password: 'Passw0rdSecret',
    };
    const { provider } = createProvider(connection);
    jest.spyOn(provider as any, 'fetchJson').mockImplementation(() => {
      // ethers throws this one synchronously
      return fetchJson(connection, '{}');
    });

    const error = await catchError(provider.send('eth_blockNumber', []));

    expect(error.code).toBe('INVALID_ARGUMENT');
    expectClean(error, insecure, key);
  });

  test('fallback provider: AllProvidersFailedError.cause and logs are clean', async () => {
    const lines: string[] = [];
    const capture = (...args: unknown[]) =>
      lines.push(
        args
          .map((a) => (typeof a === 'string' ? a : sanitizeError(a)))
          .join(' '),
      );
    const logger = {
      log: capture,
      warn: capture,
      error: capture,
      debug: capture,
    } as unknown as LoggerService;
    mockGetUrl(async () => response(500, 'internal error'));

    const urls = secretEndpoints.slice(0, 3).map(([, url]) => url);
    const provider = new SimpleFallbackJsonRpcBatchProvider(
      {
        urls: urls as [string, ...string[]],
        network: 1,
        maxRetries: 2,
        minBackoffMs: 1,
        maxBackoffMs: 2,
        requestPolicy: {
          jsonRpcMaxBatchSize: 1,
          maxConcurrentRequests: 1,
          batchAggregationWaitMs: 1,
        },
      },
      logger,
    );

    const error = await catchError(provider.getBlockNumber());
    clearTimeout((provider as any).resetTimer);

    expect(error).toBeInstanceOf(AllProvidersFailedError);
    expect(error.cause.reason).toBe('bad response');
    for (const [, url, key] of secretEndpoints.slice(0, 3)) {
      expect(findPiece(collectStrings(error), key)).toBeUndefined();
      expect(findPiece(lines.join('\n'), key)).toBeUndefined();
      expect(lines.join('\n')).toContain(redactUrl(url));
    }
    expect(urls.map(redactUrl)).toContain(error.cause.url);
  });
});
