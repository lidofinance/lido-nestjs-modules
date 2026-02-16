import { inspect } from 'util';
import {
  sanitizeError,
  sanitizeErrorData,
  sanitizeErrorInPlace,
} from '../src/common/sanitize-error';
import { FetchError } from '../src/error/fetch.error';
import { RequestTimeoutError } from '../src/error/request-timeout.error';
import { AllProvidersFailedError } from '../src/error/all-providers-failed.error';
import {
  createFetchErrorUnexpectedBatchResult,
  createFetchErrorPartialBatchResult,
  createFetchErrorJsonRpcError,
  createRequestTimeoutError,
  createEthersServerError,
  createEthersServerErrorBatchChunk,
  createEthersServerErrorBatchTooLarge,
  createEthersServerErrorBatchRateLimited,
  createEthersServerErrorBatchProxyTimeout,
  createEthersServerErrorBatchConnReset,
  createEthersServerErrorWithBody,
  createEthersNestedServerError,
  createEthersCallException,
  createEthersTimeoutError,
  createEthersNetworkError,
  createNativeNetworkError,
  createAllProvidersFailedError,
  createEthersServerErrorWithHugeBody,
} from './fixtures/error-mocks';

// ============================================================
// Helpers
// ============================================================

function makePayload(bytes: number): string {
  return 'x'.repeat(bytes);
}

function makeJsonPayload(bytes: number): object {
  const itemSize = 120;
  const count = Math.max(1, Math.ceil(bytes / itemSize));
  return {
    results: Array.from({ length: count }, (_, i) => ({
      idx: i,
      data: 'a'.repeat(80),
    })),
  };
}

function inflateError(
  error: Error,
  fields: Array<'data' | 'body' | 'requestBody' | 'serverError'>,
  bytes: number,
): void {
  const err = error as unknown as Record<string, unknown>;
  for (const field of fields) {
    if (field === 'serverError') {
      err[field] = makeJsonPayload(bytes);
    } else {
      err[field] = makePayload(bytes);
    }
  }
}

const SIZES = [
  ['1KB', 1_000],
  ['10KB', 10_000],
  ['100KB', 100_000],
  ['1MB', 1_000_000],
] as const;

const INFLATABLE_ERRORS: Array<
  [string, () => Error, Array<'data' | 'body' | 'requestBody' | 'serverError'>]
> = [
  [
    'FetchError UNEXPECTED_BATCH_RESULT',
    createFetchErrorUnexpectedBatchResult,
    ['data'],
  ],
  ['FetchError JSON-RPC error', createFetchErrorJsonRpcError, ['data']],
  [
    'Ethers SERVER_ERROR single',
    createEthersServerError,
    ['requestBody', 'serverError'],
  ],
  [
    'Ethers SERVER_ERROR batch chunk',
    createEthersServerErrorBatchChunk,
    ['requestBody', 'serverError'],
  ],
  [
    'Ethers SERVER_ERROR batch too large',
    createEthersServerErrorBatchTooLarge,
    ['body', 'requestBody'],
  ],
  [
    'Ethers SERVER_ERROR batch rate limited',
    createEthersServerErrorBatchRateLimited,
    ['body', 'requestBody'],
  ],
  [
    'Ethers SERVER_ERROR batch proxy timeout',
    createEthersServerErrorBatchProxyTimeout,
    ['body', 'requestBody'],
  ],
  [
    'Ethers SERVER_ERROR batch conn reset',
    createEthersServerErrorBatchConnReset,
    ['requestBody', 'serverError'],
  ],
  [
    'Ethers SERVER_ERROR with body',
    createEthersServerErrorWithBody,
    ['body', 'requestBody'],
  ],
  ['Ethers TIMEOUT', createEthersTimeoutError, ['requestBody']],
  ['Ethers CALL_EXCEPTION', createEthersCallException, ['data']],
  [
    'Ethers SERVER_ERROR huge body',
    createEthersServerErrorWithHugeBody,
    ['body', 'requestBody'],
  ],
];

// ============================================================
// sanitizeError — returns a bounded string via util.inspect
//
// INVARIANTS:
//   INV-SE-1:  Always returns a string
//   INV-SE-2:  Contains error name and message
//   INV-SE-3:  Contains error code / ethers metadata
//   INV-SE-4:  Output is bounded by maxLength
//   INV-SE-5:  Handles null/undefined/non-object input
//   INV-SE-6:  Handles circular references (via inspect [Circular])
//   INV-SE-7:  Handles throwing getters without crashing
//   INV-SE-8:  Never throws
// ============================================================

describe('sanitizeError', () => {
  // ----------------------------------------
  // INV-SE-1: always returns a string
  // ----------------------------------------
  describe('always returns a string', () => {
    test('Error object', () => {
      expect(typeof sanitizeError(new Error('test'))).toBe('string');
    });

    test('FetchError', () => {
      expect(
        typeof sanitizeError(createFetchErrorUnexpectedBatchResult()),
      ).toBe('string');
    });

    test('Ethers SERVER_ERROR', () => {
      expect(typeof sanitizeError(createEthersServerError())).toBe('string');
    });
  });

  // ----------------------------------------
  // INV-SE-5: null / undefined / non-object
  // ----------------------------------------
  describe('null, undefined, and primitive input', () => {
    test('null', () => {
      const result = sanitizeError(null);
      expect(typeof result).toBe('string');
      expect(result).toContain('null');
    });

    test('undefined', () => {
      const result = sanitizeError(undefined);
      expect(typeof result).toBe('string');
      expect(result).toContain('undefined');
    });

    test('string', () => {
      const result = sanitizeError('something broke');
      expect(result).toContain('something broke');
    });

    test('number', () => {
      const result = sanitizeError(42);
      expect(result).toContain('42');
    });
  });

  // ----------------------------------------
  // INV-SE-2: contains name and message
  // ----------------------------------------
  describe('contains error identity', () => {
    test('FetchError UNEXPECTED_BATCH_RESULT', () => {
      const error = createFetchErrorUnexpectedBatchResult();
      const result = sanitizeError(error);

      expect(result).toContain('FetchError');
      expect(result).toContain('Unexpected batch result');
    });

    test('FetchError PARTIAL_BATCH_RESULT', () => {
      const error = createFetchErrorPartialBatchResult();
      const result = sanitizeError(error);

      expect(result).toContain('FetchError');
      expect(result).toContain('Partial payload batch result');
    });

    test('FetchError JSON-RPC error', () => {
      const error = createFetchErrorJsonRpcError();
      const result = sanitizeError(error);

      expect(result).toContain('execution reverted');
    });

    test('RequestTimeoutError', () => {
      const error = createRequestTimeoutError();
      const result = sanitizeError(error);

      expect(result).toContain('RequestTimeoutError');
      expect(result).toContain('Request timeout after 12000ms');
      expect(result).toContain('12000');
    });

    test('Ethers SERVER_ERROR', () => {
      const error = createEthersServerError();
      const result = sanitizeError(error, 5000);

      expect(result).toContain('SERVER_ERROR');
    });

    test('Ethers CALL_EXCEPTION', () => {
      const error = createEthersCallException();
      const result = sanitizeError(error);

      expect(result).toContain('CALL_EXCEPTION');
      expect(result).toContain('balanceOf(address)');
    });

    test('Ethers TIMEOUT', () => {
      const error = createEthersTimeoutError();
      const result = sanitizeError(error, 5000);

      expect(result).toContain('TIMEOUT');
    });

    test('Ethers NETWORK_ERROR', () => {
      const error = createEthersNetworkError();
      const result = sanitizeError(error, 5000);

      expect(result).toContain('NETWORK_ERROR');
    });

    test('Native ENOTFOUND', () => {
      const error = createNativeNetworkError();
      const result = sanitizeError(error);

      expect(result).toContain('ENOTFOUND');
      expect(result).toContain('mainnet.infura.io');
    });

    test('AllProvidersFailedError', () => {
      const error = createAllProvidersFailedError();
      const result = sanitizeError(error);

      expect(result).toContain('AllProvidersFailedError');
      expect(result).toContain('eth_getLogs');
    });
  });

  // ----------------------------------------
  // INV-SE-3: contains ethers metadata
  // ----------------------------------------
  describe('contains ethers-specific metadata', () => {
    test('reason from SERVER_ERROR', () => {
      const error = createEthersServerError();
      const result = sanitizeError(error);

      expect(result).toContain('missing response');
    });

    test('reason from rate-limited batch', () => {
      const error = createEthersServerErrorBatchRateLimited();
      const result = sanitizeError(error);

      expect(result).toContain('bad response');
    });

    test('method from CALL_EXCEPTION', () => {
      const error = createEthersCallException();
      const result = sanitizeError(error);

      expect(result).toContain('balanceOf(address)');
    });
  });

  // ----------------------------------------
  // INV-SE-4: output is bounded
  // ----------------------------------------
  describe('output is bounded', () => {
    test('long string error is truncated', () => {
      const longStr = 'x'.repeat(2000);
      const result = sanitizeError(longStr, 100);

      expect(result.length).toBeLessThan(200);
      expect(result).toContain('...[truncated');
    });

    test('error with 50 MB fields is bounded', () => {
      const error = new Error('huge') as Error & Record<string, unknown>;
      error.data = 'x'.repeat(50_000_000);
      error.body = 'y'.repeat(50_000_000);

      const result = sanitizeError(error, 1000);

      expect(result.length).toBeLessThan(1200);
      expect(result).toContain('...[truncated');
    });

    test('custom maxLength=50', () => {
      const error = createEthersServerErrorBatchChunk();
      const result = sanitizeError(error, 50);

      expect(result.length).toBeLessThan(150);
    });

    test('custom maxLength=10000 preserves small errors fully', () => {
      const error = createFetchErrorJsonRpcError();
      const result = sanitizeError(error, 10000);

      expect(result).toContain('execution reverted');
      expect(result).not.toContain('...[truncated');
    });
  });

  // ----------------------------------------
  // INV-SE-6: circular references
  // ----------------------------------------
  describe('handles circular references', () => {
    test('err.cause = err (self-referencing)', () => {
      const err = new Error('Boom') as Error & Record<string, unknown>;
      err.cause = err;

      expect(() => sanitizeError(err)).not.toThrow();
      const result = sanitizeError(err);
      expect(result).toContain('Boom');
      // inspect uses <ref *N> / [Circular *N] notation for circular references
      expect(result).toMatch(/Circular|ref \*/);
    });

    test('err.error = err (self-referencing)', () => {
      const err = new Error('Boom') as Error & Record<string, unknown>;
      err.error = err;

      expect(() => sanitizeError(err)).not.toThrow();
      const result = sanitizeError(err);
      // inspect uses <ref *N> / [Circular *N] notation for circular references
      expect(result).toMatch(/Circular|ref \*/);
    });

    test('A.cause = B, B.cause = A (mutual cycle)', () => {
      const a = new Error('A') as Error & Record<string, unknown>;
      const b = new Error('B') as Error & Record<string, unknown>;
      a.cause = b;
      b.cause = a;

      expect(() => sanitizeError(a)).not.toThrow();
      const result = sanitizeError(a);
      // inspect uses <ref *N> / [Circular *N] notation for circular references
      expect(result).toMatch(/Circular|ref \*/);
    });

    test('3-error chain with cycle back to root', () => {
      const a = new Error('A') as Error & Record<string, unknown>;
      const b = new Error('B') as Error & Record<string, unknown>;
      const c = new Error('C') as Error & Record<string, unknown>;
      a.cause = b;
      b.cause = c;
      c.cause = a;

      expect(() => sanitizeError(a)).not.toThrow();
    });
  });

  // ----------------------------------------
  // INV-SE-7: throwing getters
  // ----------------------------------------
  describe('handles throwing getters', () => {
    test('throwing getter on data — does not crash', () => {
      const err = new Error('getter-boom');
      Object.defineProperty(err, 'data', {
        get() {
          throw new Error('getter exploded');
        },
        enumerable: true,
      });

      expect(() => sanitizeError(err)).not.toThrow();
      const result = sanitizeError(err);
      expect(result).toContain('getter-boom');
    });

    test('throwing getter on cause — does not crash', () => {
      const err = new Error('getter-cause');
      Object.defineProperty(err, 'cause', {
        get() {
          throw new Error('cause getter exploded');
        },
        enumerable: true,
      });

      expect(() => sanitizeError(err)).not.toThrow();
    });
  });

  // ----------------------------------------
  // INV-SE-7b: object with throwing [util.inspect.custom]
  // ----------------------------------------
  describe('handles unserializable error (inspect itself throws)', () => {
    test('returns fallback string', () => {
      const err = {
        message: 'boom',
        [inspect.custom]() {
          throw new Error('inspect exploded');
        },
      };

      const result = sanitizeError(err);
      expect(result).toBe('[unserializable error]');
    });
  });

  // ----------------------------------------
  // INV-SE-8: never throws — every error mock
  // ----------------------------------------
  describe('never throws for any error mock type', () => {
    const errorFactories = [
      [
        'FetchError UNEXPECTED_BATCH_RESULT',
        createFetchErrorUnexpectedBatchResult,
      ],
      ['FetchError PARTIAL_BATCH_RESULT', createFetchErrorPartialBatchResult],
      ['FetchError JSON-RPC error', createFetchErrorJsonRpcError],
      ['RequestTimeoutError', createRequestTimeoutError],
      ['Ethers SERVER_ERROR single', createEthersServerError],
      ['Ethers SERVER_ERROR batch chunk', createEthersServerErrorBatchChunk],
      [
        'Ethers SERVER_ERROR batch too large',
        createEthersServerErrorBatchTooLarge,
      ],
      [
        'Ethers SERVER_ERROR batch rate limited',
        createEthersServerErrorBatchRateLimited,
      ],
      [
        'Ethers SERVER_ERROR batch proxy timeout',
        createEthersServerErrorBatchProxyTimeout,
      ],
      [
        'Ethers SERVER_ERROR batch conn reset',
        createEthersServerErrorBatchConnReset,
      ],
      ['Ethers SERVER_ERROR with body', createEthersServerErrorWithBody],
      ['Ethers nested SERVER_ERROR', createEthersNestedServerError],
      ['Ethers CALL_EXCEPTION', createEthersCallException],
      ['Ethers TIMEOUT', createEthersTimeoutError],
      ['Ethers NETWORK_ERROR', createEthersNetworkError],
      ['Native network error', createNativeNetworkError],
      ['AllProvidersFailedError', createAllProvidersFailedError],
      ['Ethers SERVER_ERROR huge body', createEthersServerErrorWithHugeBody],
    ] as const;

    test.each(errorFactories)(
      '%s — returns bounded string',
      (_name, factory) => {
        const error = factory();
        const result = sanitizeError(error, 500);

        expect(typeof result).toBe('string');
        expect(result.length).toBeLessThan(1000);
      },
    );
  });
});

// ============================================================
// sanitizeErrorData
// ============================================================

describe('sanitizeErrorData', () => {
  describe('preserves small values', () => {
    test('null', () => {
      expect(sanitizeErrorData(null)).toBeNull();
    });

    test('undefined', () => {
      expect(sanitizeErrorData(undefined)).toBeUndefined();
    });

    test('number', () => {
      expect(sanitizeErrorData(42)).toBe(42);
    });

    test('boolean', () => {
      expect(sanitizeErrorData(true)).toBe(true);
    });

    test('short string', () => {
      expect(sanitizeErrorData('0x1234')).toBe('0x1234');
    });

    test('small object', () => {
      const obj = { code: -32005, message: 'rate limit exceeded' };
      expect(sanitizeErrorData(obj)).toEqual(obj);
    });
  });

  describe('truncates long strings', () => {
    test('string slightly over maxLength', () => {
      const str = 'x'.repeat(1100);
      const result = sanitizeErrorData(str) as string;

      expect(result.length).toBeLessThan(1200);
      expect(result).toContain('...[truncated, total length: 1100]');
    });

    test('string exactly at maxLength is preserved', () => {
      const str = 'x'.repeat(1000);
      expect(sanitizeErrorData(str)).toBe(str);
    });

    test('string one over maxLength is truncated', () => {
      const str = 'x'.repeat(1001);
      const result = sanitizeErrorData(str) as string;

      expect(result).toContain('...[truncated');
    });

    test('hex revert data (194 chars) preserved under default maxLength', () => {
      const hex =
        '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001a4e6f7420656e6f75676820616c6c6f77616e636500000000000000000000000000';
      expect(sanitizeErrorData(hex)).toBe(hex);
    });

    test('custom maxLength=50', () => {
      const str = 'y'.repeat(100);
      const result = sanitizeErrorData(str, 50) as string;

      expect(result).toContain('...[truncated, total length: 100]');
      expect(result.startsWith('y'.repeat(50))).toBe(true);
    });
  });

  describe('truncates large objects', () => {
    test('large object', () => {
      const obj = {
        results: Array.from({ length: 1000 }, (_, i) => ({
          index: i,
          data: 'a'.repeat(100),
        })),
      };
      const result = sanitizeErrorData(obj, 500) as string;

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(1000);
      expect(result).toContain('...[truncated');
    });

    test('object under maxLength is preserved as-is (not stringified)', () => {
      const obj = { requestedId: 7, receivedIds: [1, 2, 3], batchSize: 3 };
      const result = sanitizeErrorData(obj);

      expect(result).toEqual(obj);
      expect(typeof result).toBe('object');
    });
  });

  describe('handles circular references', () => {
    test('small circular object is returned as-is (util.inspect handles circulars)', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj;

      const result = sanitizeErrorData(obj);
      expect(result).toBe(obj);
    });

    test('large circular object is truncated', () => {
      const obj: Record<string, unknown> = { a: 1, data: 'x'.repeat(5000) };
      obj.self = obj;

      const result = sanitizeErrorData(obj, 100) as string;
      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(200);
      expect(result).toContain('...[truncated');
    });
  });

  describe('truncation marker', () => {
    test('marker contains total length for strings', () => {
      const str = 'z'.repeat(5000);
      const result = sanitizeErrorData(str, 100) as string;

      expect(result).toContain('...[truncated, total length: 5000]');
    });

    test('marker contains total length for objects', () => {
      const obj = { data: 'x'.repeat(5000) };
      const result = sanitizeErrorData(obj, 100) as string;

      expect(result).toMatch(/\.\.\.\[truncated, total length: \d+\]/);
    });
  });

  describe('real error data scenarios', () => {
    test('batchResult.error (from UNEXPECTED_BATCH_RESULT)', () => {
      const data = { code: -32005, message: 'rate limit exceeded' };
      expect(sanitizeErrorData(data)).toEqual(data);
    });

    test('payload.error.data (huge revert data)', () => {
      const data = '0x' + 'ff'.repeat(10000);
      const result = sanitizeErrorData(data, 500) as string;

      expect(result.length).toBeLessThan(1000);
      expect(result).toContain('...[truncated');
    });

    test('payload.error.data (small revert data)', () => {
      const data = '0x08c379a0';
      expect(sanitizeErrorData(data)).toBe(data);
    });

    test('partial batch result data (structured)', () => {
      const data = {
        requestedId: 7,
        receivedIds: [1, 2, 3, 4, 5, 6],
        batchSize: 6,
      };
      expect(sanitizeErrorData(data)).toEqual(data);
    });
  });

  describe('handles unserializable object (inspect itself throws)', () => {
    test('returns fallback string', () => {
      const obj = {
        [inspect.custom]() {
          throw new Error('inspect exploded');
        },
      };

      expect(sanitizeErrorData(obj)).toBe('[unserializable]');
    });
  });
});

// ============================================================
// sanitizeErrorInPlace
// ============================================================

describe('sanitizeErrorInPlace', () => {
  describe('handles null/undefined/non-object without throwing', () => {
    test('null', () => {
      expect(() => sanitizeErrorInPlace(null)).not.toThrow();
    });

    test('undefined', () => {
      expect(() => sanitizeErrorInPlace(undefined)).not.toThrow();
    });

    test('string', () => {
      expect(() => sanitizeErrorInPlace('error')).not.toThrow();
    });

    test('number', () => {
      expect(() => sanitizeErrorInPlace(42)).not.toThrow();
    });
  });

  describe('mutates error in place', () => {
    test('returns void', () => {
      const error = createEthersServerError();
      expect(sanitizeErrorInPlace(error)).toBeUndefined();
    });

    test('same reference after sanitization', () => {
      const error = createEthersServerError();
      const ref = error;
      sanitizeErrorInPlace(error);

      expect(error).toBe(ref);
    });
  });

  describe('preserves instanceof', () => {
    test('FetchError', () => {
      const error = createFetchErrorUnexpectedBatchResult();
      sanitizeErrorInPlace(error);

      expect(error).toBeInstanceOf(FetchError);
      expect(error).toBeInstanceOf(Error);
    });

    test('RequestTimeoutError', () => {
      const error = createRequestTimeoutError();
      sanitizeErrorInPlace(error);

      expect(error).toBeInstanceOf(RequestTimeoutError);
      expect(error).toBeInstanceOf(Error);
      expect(error.timeoutMs).toBe(12000);
    });

    test('AllProvidersFailedError', () => {
      const error = createAllProvidersFailedError();
      sanitizeErrorInPlace(error);

      expect(error).toBeInstanceOf(AllProvidersFailedError);
      expect(error).toBeInstanceOf(Error);
    });

    test('AllProvidersFailedError.cause preserves instanceof after sanitization', () => {
      const cause = createRequestTimeoutError();
      const error = new AllProvidersFailedError('all failed');
      error.cause = cause;

      sanitizeErrorInPlace(error);

      expect(error.cause).toBeInstanceOf(RequestTimeoutError);
      expect((error.cause as RequestTimeoutError).timeoutMs).toBe(12000);
    });

    test('native Error', () => {
      const error = createEthersServerError();
      sanitizeErrorInPlace(error);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('truncates heavy fields', () => {
    const MAX = 500;

    for (const [errorName, factory, fields] of INFLATABLE_ERRORS) {
      for (const [sizeName, sizeBytes] of SIZES) {
        test(`${errorName} inflated to ${sizeName} — heavy fields truncated in place`, () => {
          const error = factory();
          inflateError(error, fields, sizeBytes);

          sanitizeErrorInPlace(error, MAX);

          const err = error as unknown as Record<string, unknown>;
          for (const field of fields) {
            if (err[field] !== undefined) {
              const serialized =
                typeof err[field] === 'string'
                  ? (err[field] as string)
                  : JSON.stringify(err[field]);
              expect(serialized.length).toBeLessThanOrEqual(MAX + 100);
              if (sizeBytes > MAX) {
                expect(serialized).toContain('...[truncated');
              }
            }
          }

          expect(error).toBeInstanceOf(Error);
        });
      }
    }

    test('does not truncate fields that are under maxLength', () => {
      const error = createFetchErrorPartialBatchResult();
      const originalData = { ...(error.data as object) };

      sanitizeErrorInPlace(error, 10000);

      expect(error.data).toEqual(originalData);
    });
  });

  describe('preserves non-heavy fields', () => {
    test('name, message, code on FetchError', () => {
      const error = createFetchErrorUnexpectedBatchResult();
      sanitizeErrorInPlace(error);

      expect(error.name).toBe('FetchError');
      expect(error.message).toBe(
        'Unexpected batch result. Possible reason: "rate limit exceeded".',
      );
      expect(error.code).toBe('UNEXPECTED_BATCH_RESULT');
    });

    test('reason, requestMethod, url on ethers error', () => {
      const error = createEthersServerError();
      sanitizeErrorInPlace(error);

      const err = error as unknown as Record<string, unknown>;
      expect(err.reason).toBe('missing response');
      expect(err.requestMethod).toBe('POST');
      expect(err.url).toBe(
        'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
      );
    });

    test('method on CALL_EXCEPTION', () => {
      const error = createEthersCallException();
      sanitizeErrorInPlace(error);

      const err = error as unknown as Record<string, unknown>;
      expect(err.method).toBe('balanceOf(address)');
      expect(err.code).toBe('CALL_EXCEPTION');
    });

    test('message, timeoutMs on RequestTimeoutError', () => {
      const error = createRequestTimeoutError();
      sanitizeErrorInPlace(error);

      expect(error.message).toBe('Request timeout after 12000ms');
      expect(error.timeoutMs).toBe(12000);
    });

    test('stack trace is preserved (not removed)', () => {
      const error = createEthersServerError();
      const stackBefore = error.stack;
      sanitizeErrorInPlace(error);

      expect(error.stack).toBe(stackBefore);
    });
  });

  describe('recursively sanitizes nested errors', () => {
    test('AllProvidersFailedError with huge-body cause', () => {
      const hugeError = createEthersServerErrorWithHugeBody();
      const allFailed = new AllProvidersFailedError('all failed');
      allFailed.cause = hugeError;

      sanitizeErrorInPlace(allFailed, 500);

      expect(allFailed).toBeInstanceOf(AllProvidersFailedError);
      expect(allFailed.cause).toBeInstanceOf(Error);

      const cause = allFailed.cause as Record<string, unknown>;
      const body = cause.body as string;
      expect(body.length).toBeLessThan(1000);
      expect(body).toContain('...[truncated');
    });

    test('nested ethers error chain (outer.error.serverError)', () => {
      const error = createEthersNestedServerError();
      const outer = error as unknown as Record<string, unknown>;

      sanitizeErrorInPlace(error, 30);

      const requestBody = outer.requestBody as string;
      expect(requestBody.length).toBeLessThan(150);

      const middleAfter = outer.error as Record<string, unknown>;
      expect(middleAfter.serverError).toBeDefined();
    });

    test('cause chain: AllProvidersFailedError -> FetchError with huge data', () => {
      const fetchError = new FetchError('revert');
      fetchError.data = 'x'.repeat(50_000);

      const allFailed = new AllProvidersFailedError('all failed');
      allFailed.cause = fetchError;

      sanitizeErrorInPlace(allFailed, 500);

      expect(allFailed).toBeInstanceOf(AllProvidersFailedError);
      expect(allFailed.cause).toBeInstanceOf(FetchError);

      const causeData = (allFailed.cause as FetchError).data as string;
      expect(causeData.length).toBeLessThan(1000);
      expect(causeData).toContain('...[truncated');
    });
  });

  describe('circular error chains (stack overflow protection)', () => {
    test('err.cause = err (self-referencing)', () => {
      const err = new Error('Boom') as Error & Record<string, unknown>;
      err.cause = err;

      expect(() => sanitizeErrorInPlace(err)).not.toThrow();
    });

    test('A.cause = B, B.cause = A', () => {
      const a = new Error('A') as Error & Record<string, unknown>;
      const b = new Error('B') as Error & Record<string, unknown>;
      a.cause = b;
      b.cause = a;

      expect(() => sanitizeErrorInPlace(a)).not.toThrow();
    });
  });

  describe('read-only properties', () => {
    test('frozen error — does not throw', () => {
      const err = new Error('frozen');
      (err as unknown as Record<string, unknown>).data = 'x'.repeat(5000);
      Object.freeze(err);

      expect(() => sanitizeErrorInPlace(err, 100)).not.toThrow();
    });

    test('non-writable data property — does not throw', () => {
      const err = new Error('readonly');
      Object.defineProperty(err, 'data', {
        value: 'x'.repeat(5000),
        writable: false,
        enumerable: true,
      });

      expect(() => sanitizeErrorInPlace(err, 100)).not.toThrow();
    });

    test('non-writable body — does not throw, other fields still sanitized', () => {
      const err = new Error('partial-readonly') as Error &
        Record<string, unknown>;
      Object.defineProperty(err, 'body', {
        value: 'y'.repeat(5000),
        writable: false,
        enumerable: true,
      });
      err.data = 'x'.repeat(5000);

      sanitizeErrorInPlace(err, 100);

      expect((err.body as string).length).toBe(5000);
      expect((err.data as string).length).toBeLessThan(300);
    });
  });

  describe('dangerous getters', () => {
    test('throwing getter on data — does not crash', () => {
      const err = new Error('getter-inplace');
      Object.defineProperty(err, 'data', {
        get() {
          throw new Error('getter exploded');
        },
        enumerable: true,
      });

      expect(() => sanitizeErrorInPlace(err)).not.toThrow();
    });

    test('throwing getter on cause — does not crash', () => {
      const err = new Error('getter-cause-inplace');
      Object.defineProperty(err, 'cause', {
        get() {
          throw new Error('cause getter exploded');
        },
        enumerable: true,
      });

      expect(() => sanitizeErrorInPlace(err)).not.toThrow();
    });
  });

  describe('heavy fields are bounded after mutation', () => {
    const MAX = 500;

    for (const [errorName, factory, fields] of INFLATABLE_ERRORS) {
      for (const [sizeName, sizeBytes] of SIZES) {
        test(`${errorName} inflated to ${sizeName} — all heavy fields bounded`, () => {
          const error = factory();
          inflateError(error, fields, sizeBytes);

          sanitizeErrorInPlace(error, MAX);

          const err = error as unknown as Record<string, unknown>;
          for (const field of ['data', 'body', 'requestBody', 'serverError']) {
            if (err[field] !== undefined) {
              const serialized =
                typeof err[field] === 'string'
                  ? (err[field] as string)
                  : JSON.stringify(err[field]);
              expect(serialized.length).toBeLessThan(MAX + 200);
            }
          }
        });
      }
    }
  });

  describe('works for every error mock type without throwing', () => {
    const errorFactories = [
      [
        'FetchError UNEXPECTED_BATCH_RESULT',
        createFetchErrorUnexpectedBatchResult,
      ],
      ['FetchError PARTIAL_BATCH_RESULT', createFetchErrorPartialBatchResult],
      ['FetchError JSON-RPC error', createFetchErrorJsonRpcError],
      ['RequestTimeoutError', createRequestTimeoutError],
      ['Ethers SERVER_ERROR single', createEthersServerError],
      ['Ethers SERVER_ERROR batch chunk', createEthersServerErrorBatchChunk],
      [
        'Ethers SERVER_ERROR batch too large',
        createEthersServerErrorBatchTooLarge,
      ],
      [
        'Ethers SERVER_ERROR batch rate limited',
        createEthersServerErrorBatchRateLimited,
      ],
      [
        'Ethers SERVER_ERROR batch proxy timeout',
        createEthersServerErrorBatchProxyTimeout,
      ],
      [
        'Ethers SERVER_ERROR batch conn reset',
        createEthersServerErrorBatchConnReset,
      ],
      ['Ethers SERVER_ERROR with body', createEthersServerErrorWithBody],
      ['Ethers nested SERVER_ERROR', createEthersNestedServerError],
      ['Ethers CALL_EXCEPTION', createEthersCallException],
      ['Ethers TIMEOUT', createEthersTimeoutError],
      ['Ethers NETWORK_ERROR', createEthersNetworkError],
      ['Native network error', createNativeNetworkError],
      ['AllProvidersFailedError', createAllProvidersFailedError],
      ['Ethers SERVER_ERROR huge body', createEthersServerErrorWithHugeBody],
    ] as const;

    test.each(errorFactories)(
      '%s — sanitizeErrorInPlace does not throw',
      (_name, factory) => {
        const error = factory();
        expect(() => sanitizeErrorInPlace(error, 500)).not.toThrow();
        expect(error).toBeInstanceOf(Error);
      },
    );
  });
});

// ============================================================
// V8 string limit protection — huge data tests
// ============================================================

describe('V8 string limit protection — huge data', () => {
  const MAX = 1000;

  describe('huge string fields', () => {
    test('sanitizeErrorData — 50 MB string', () => {
      const huge = 'x'.repeat(50_000_000);
      const result = sanitizeErrorData(huge, MAX) as string;

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
      expect(result).toContain('...[truncated, total length: 50000000]');
    });

    test('sanitizeError — error with 50 MB data/body/requestBody', () => {
      const error = new Error('huge') as Error & Record<string, unknown>;
      error.data = 'x'.repeat(50_000_000);
      error.body = 'y'.repeat(50_000_000);
      error.requestBody = 'z'.repeat(50_000_000);

      const result = sanitizeError(error, MAX);

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
    });

    test('sanitizeErrorInPlace — 50 MB fields truncated in place', () => {
      const error = new Error('huge') as Error & Record<string, unknown>;
      error.data = 'x'.repeat(50_000_000);
      error.body = 'y'.repeat(50_000_000);

      sanitizeErrorInPlace(error, MAX);

      expect((error.data as string).length).toBeLessThan(MAX + 100);
      expect((error.body as string).length).toBeLessThan(MAX + 100);
    });
  });

  describe('objects producing gigabyte-scale JSON', () => {
    test('sanitizeErrorData — array of 1M shared objects (~1 GB JSON)', () => {
      const sharedItem = { id: 0, data: 'x'.repeat(100) };
      const hugeArray = new Array(1_000_000).fill(sharedItem);

      const result = sanitizeErrorData(hugeArray, MAX) as string;

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
      expect(result).toContain('...[truncated');
    });

    test('sanitizeErrorData — object with 1M-element array field', () => {
      const sharedItem = { id: 0, payload: 'a'.repeat(100) };
      const hugeObj = {
        results: new Array(1_000_000).fill(sharedItem),
      };

      const result = sanitizeErrorData(hugeObj, MAX) as string;

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
      expect(result).toContain('...[truncated');
    });

    test('sanitizeError — error carrying 1M-element data field', () => {
      const sharedItem = { id: 0, payload: 'a'.repeat(100) };
      const error = new Error('huge payload') as Error &
        Record<string, unknown>;
      error.data = new Array(1_000_000).fill(sharedItem);

      const result = sanitizeError(error, MAX);

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
    });
  });

  describe('deeply nested structures', () => {
    test('sanitizeErrorData — 1000-level nesting with data at each level', () => {
      const root: Record<string, unknown> = {};
      let current = root;
      for (let i = 0; i < 1000; i++) {
        current.data = 'x'.repeat(10_000);
        current.nested = {};
        current = current.nested as Record<string, unknown>;
      }

      const result = sanitizeErrorData(root, MAX) as string;

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
      expect(result).toContain('...[truncated');
    });

    test('sanitizeError — error with deeply nested serverError', () => {
      const root: Record<string, unknown> = {};
      let current = root;
      for (let i = 0; i < 100; i++) {
        current.body = 'y'.repeat(10_000);
        current.error = {};
        current = current.error as Record<string, unknown>;
      }

      const error = new Error('deep') as Error & Record<string, unknown>;
      error.serverError = root;

      const result = sanitizeError(error, MAX);

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
    });
  });

  describe('circular references at scale', () => {
    test('sanitizeErrorData — circular with large payload', () => {
      const obj: Record<string, unknown> = {
        data: 'x'.repeat(100_000),
      };
      obj.self = obj;

      const result = sanitizeErrorData(obj, MAX) as string;

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
      expect(result).toContain('...[truncated');
    });

    test('sanitizeError — error with circular data field', () => {
      const payload: Record<string, unknown> = {
        items: new Array(10_000).fill('x'.repeat(100)),
      };
      payload.ref = payload;

      const error = new Error('circular') as Error & Record<string, unknown>;
      error.data = payload;

      const result = sanitizeError(error, MAX);

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(MAX + 100);
    });
  });

  describe('performance', () => {
    test('50 MB string truncation completes in < 100 ms', () => {
      const huge = 'x'.repeat(50_000_000);
      const start = performance.now();
      sanitizeErrorData(huge, MAX);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    test('1M-element array truncation completes in < 500 ms', () => {
      const sharedItem = { id: 0, data: 'x'.repeat(100) };
      const hugeArray = new Array(1_000_000).fill(sharedItem);

      const start = performance.now();
      sanitizeErrorData(hugeArray, MAX);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
    });
  });
});
