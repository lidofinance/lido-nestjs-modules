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
// Helpers: inflate mock errors with realistic data sizes
// ============================================================

/** Generate a string payload of a given byte size */
function makePayload(bytes: number): string {
  return 'x'.repeat(bytes);
}

/** Generate a JSON object payload of approximately a given byte size */
function makeJsonPayload(bytes: number): object {
  const itemSize = 120; // approximate JSON size of each item
  const count = Math.max(1, Math.ceil(bytes / itemSize));
  return {
    results: Array.from({ length: count }, (_, i) => ({
      idx: i,
      data: 'a'.repeat(80),
    })),
  };
}

/** Inflate heavy fields on an error to a given size */
function inflateError(
  error: Error,
  fields: Array<'data' | 'body' | 'requestBody' | 'serverError'>,
  bytes: number,
): void {
  const err = error as unknown as Record<string, unknown>;
  for (const field of fields) {
    if (field === 'serverError') {
      // serverError is typically an object, not a string
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

/** Error factories mapped to their heavy fields that can carry large data */
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
// INVARIANTS LIST
//
// sanitizeError:
//   INV-SE-1:  Always returns a plain object (Record<string, unknown>), never Error instance
//   INV-SE-2:  Preserves name, message, code from any error
//   INV-SE-3:  Preserves ethers-specific metadata: reason, method
//   INV-SE-4:  Truncates heavy fields (data, body, requestBody, serverError) to maxLength
//   INV-SE-5:  message is truncated if exceeds maxLength
//   INV-SE-6:  Nested error/cause are recursively sanitized (returns plain objects)
//   INV-SE-7:  Handles null/undefined input gracefully
//   INV-SE-8:  Handles non-object input (string, number)
//   INV-SE-9:  Preserves timeoutMs for RequestTimeoutError
//   INV-SE-10: Output JSON.stringify size is bounded
//   INV-SE-11: Does not include stack traces
//   INV-SE-12: Custom maxLength is respected
//
// sanitizeErrorData:
//   INV-SD-1:  Returns original value if within maxLength
//   INV-SD-2:  Truncates strings exceeding maxLength
//   INV-SD-3:  Truncates objects whose JSON exceeds maxLength
//   INV-SD-4:  Handles null/undefined/primitives
//   INV-SD-5:  Handles circular references (unserializable)
//   INV-SD-6:  Truncated output contains "[truncated, total length: N]" marker
//
// sanitizeErrorInPlace:
//   INV-SIP-1:  Mutates the error, does not return a new object
//   INV-SIP-2:  Preserves instanceof (FetchError, RequestTimeoutError, etc.)
//   INV-SIP-3:  Truncates heavy fields (data, body, requestBody, serverError)
//   INV-SIP-4:  Recursively sanitizes nested error/cause objects
//   INV-SIP-5:  Preserves non-heavy fields (name, message, code, reason, method, etc.)
//   INV-SIP-6:  Handles null/undefined/non-object input without throwing
//   INV-SIP-7:  After mutation, JSON.stringify of heavy fields is bounded
//
// ============================================================

describe('sanitizeError', () => {
  // ----------------------------------------
  // INV-SE-7: null / undefined
  // ----------------------------------------
  describe('null and undefined input', () => {
    test('returns {message: "null"} for null', () => {
      const result = sanitizeError(null);
      expect(result).toEqual({ message: 'null' });
    });

    test('returns {message: "undefined"} for undefined', () => {
      const result = sanitizeError(undefined);
      expect(result).toEqual({ message: 'undefined' });
    });
  });

  // ----------------------------------------
  // INV-SE-8: non-object input
  // ----------------------------------------
  describe('non-object input', () => {
    test('handles string error', () => {
      const result = sanitizeError('something broke');
      expect(result).toEqual({ message: 'something broke' });
    });

    test('handles number error', () => {
      const result = sanitizeError(42);
      expect(result).toEqual({ message: '42' });
    });

    test('truncates long string error', () => {
      const longStr = 'x'.repeat(2000);
      const result = sanitizeError(longStr, 100);
      expect((result.message as string).length).toBeLessThan(200);
      expect(result.message).toContain('...[truncated');
    });
  });

  // ----------------------------------------
  // INV-SE-1: returns plain object
  // INV-SE-11: no stack traces
  // ----------------------------------------
  describe('always returns plain object without stack', () => {
    test('FetchError UNEXPECTED_BATCH_RESULT', () => {
      const error = createFetchErrorUnexpectedBatchResult();
      const result = sanitizeError(error);

      expect(result.constructor).toBe(Object);
      expect(result).not.toBeInstanceOf(Error);
      expect(result).not.toBeInstanceOf(FetchError);
      expect(result).not.toHaveProperty('stack');
    });

    test('Ethers SERVER_ERROR', () => {
      const error = createEthersServerError();
      const result = sanitizeError(error);

      expect(result.constructor).toBe(Object);
      expect(result).not.toBeInstanceOf(Error);
      expect(result).not.toHaveProperty('stack');
    });

    test('Ethers nested SERVER_ERROR', () => {
      const error = createEthersNestedServerError();
      const result = sanitizeError(error);

      expect(result.constructor).toBe(Object);
      expect(result).not.toHaveProperty('stack');
      // nested error should also be plain
      expect((result.error as Record<string, unknown>).constructor).toBe(
        Object,
      );
    });
  });

  // ----------------------------------------
  // INV-SE-2: preserves name, message, code
  // ----------------------------------------
  describe('preserves identity fields', () => {
    test('FetchError UNEXPECTED_BATCH_RESULT', () => {
      const error = createFetchErrorUnexpectedBatchResult();
      const result = sanitizeError(error);

      expect(result.name).toBe('FetchError');
      expect(result.message).toBe(
        'Unexpected batch result. Possible reason: "rate limit exceeded".',
      );
      expect(result.code).toBe('UNEXPECTED_BATCH_RESULT');
    });

    test('FetchError PARTIAL_BATCH_RESULT', () => {
      const error = createFetchErrorPartialBatchResult();
      const result = sanitizeError(error);

      expect(result.name).toBe('FetchError');
      expect(result.message).toBe(
        'Partial payload batch result. Response 7 not found',
      );
      expect(result.code).toBe('PARTIAL_BATCH_RESULT');
    });

    test('FetchError JSON-RPC error', () => {
      const error = createFetchErrorJsonRpcError();
      const result = sanitizeError(error);

      expect(result.name).toBe('FetchError');
      expect(result.message).toBe('execution reverted');
      expect(result.code).toBe(-32000);
    });

    test('RequestTimeoutError', () => {
      const error = createRequestTimeoutError();
      const result = sanitizeError(error);

      expect(result.name).toBe('RequestTimeoutError');
      expect(result.message).toBe('Request timeout after 12000ms');
    });

    test('Ethers SERVER_ERROR', () => {
      const error = createEthersServerError();
      const result = sanitizeError(error);

      expect(result.name).toBe('Error');
      expect(result.code).toBe('SERVER_ERROR');
    });

    test('Ethers CALL_EXCEPTION', () => {
      const error = createEthersCallException();
      const result = sanitizeError(error);

      expect(result.name).toBe('Error');
      expect(result.code).toBe('CALL_EXCEPTION');
    });

    test('Ethers TIMEOUT', () => {
      const error = createEthersTimeoutError();
      const result = sanitizeError(error);

      expect(result.code).toBe('TIMEOUT');
    });

    test('Ethers NETWORK_ERROR', () => {
      const error = createEthersNetworkError();
      const result = sanitizeError(error);

      expect(result.code).toBe('NETWORK_ERROR');
    });

    test('Native ENOTFOUND', () => {
      const error = createNativeNetworkError();
      const result = sanitizeError(error);

      expect(result.name).toBe('Error');
      expect(result.code).toBe('ENOTFOUND');
      expect(result.message).toBe('getaddrinfo ENOTFOUND mainnet.infura.io');
    });

    test('AllProvidersFailedError', () => {
      const error = createAllProvidersFailedError();
      const result = sanitizeError(error);

      expect(result.name).toBe('AllProvidersFailedError');
      expect(result.message).toBe(
        'All attempts to do ETH1 RPC request failed for eth_getLogs',
      );
      expect(result.code).toBe(0);
    });
  });

  // ----------------------------------------
  // INV-SE-3: ethers-specific metadata
  // ----------------------------------------
  describe('preserves ethers-specific metadata', () => {
    test('reason from SERVER_ERROR', () => {
      const error = createEthersServerError();
      const result = sanitizeError(error);

      expect(result.reason).toBe('missing response');
    });

    test('reason from CALL_EXCEPTION', () => {
      const error = createEthersCallException();
      const result = sanitizeError(error);

      // reason is null in mock, so should not be present
      expect(result).not.toHaveProperty('reason');
    });

    test('method from CALL_EXCEPTION', () => {
      const error = createEthersCallException();
      const result = sanitizeError(error);

      expect(result.method).toBe('balanceOf(address)');
    });

    test('reason from rate-limited batch', () => {
      const error = createEthersServerErrorBatchRateLimited();
      const result = sanitizeError(error);

      expect(result.reason).toBe('bad response');
    });
  });

  // ----------------------------------------
  // INV-SE-9: preserves timeoutMs
  // ----------------------------------------
  describe('preserves timeoutMs for RequestTimeoutError', () => {
    test('timeoutMs is preserved', () => {
      const error = createRequestTimeoutError();
      const result = sanitizeError(error);

      expect(result.timeoutMs).toBe(12000);
    });

    test('timeoutMs absent on non-timeout errors', () => {
      const error = createEthersServerError();
      const result = sanitizeError(error);

      expect(result).not.toHaveProperty('timeoutMs');
    });
  });

  // ----------------------------------------
  // INV-SE-4: truncation of heavy fields
  // INV-SE-10: output size bounded
  // ----------------------------------------
  describe('truncates heavy fields', () => {
    const MAX = 500;

    test('small data object — preserved when under limit', () => {
      const error = createFetchErrorUnexpectedBatchResult();
      const result = sanitizeError(error, 500);

      expect(result.data).toEqual({
        code: -32005,
        message: 'rate limit exceeded',
      });
    });

    test('small hex data — preserved under default limit', () => {
      const error = createFetchErrorJsonRpcError();
      const result = sanitizeError(error);

      expect(result.data).toBe((error as FetchError).data);
    });

    for (const [errorName, factory, fields] of INFLATABLE_ERRORS) {
      for (const [sizeName, sizeBytes] of SIZES) {
        test(`${errorName} inflated to ${sizeName} — heavy fields truncated and output bounded`, () => {
          const error = factory();
          inflateError(error, fields, sizeBytes);

          const result = sanitizeError(error, MAX);

          // each inflated heavy field must be truncated
          for (const field of fields) {
            const value = result[field];
            if (value !== undefined) {
              const serialized =
                typeof value === 'string' ? value : JSON.stringify(value);
              expect(serialized.length).toBeLessThanOrEqual(MAX + 100);
              if (sizeBytes > MAX) {
                expect(serialized).toContain('...[truncated');
              }
            }
          }

          // total output size must be bounded regardless of input size
          const totalSize = JSON.stringify(result).length;
          expect(totalSize).toBeLessThan(MAX * 10);
        });
      }
    }
  });

  // ----------------------------------------
  // INV-SE-5: message truncation
  // ----------------------------------------
  describe('truncates long messages', () => {
    test('Ethers SERVER_ERROR with huge body has long message — truncated', () => {
      const error = createEthersServerErrorWithHugeBody();
      const originalMessage = error.message;
      expect(originalMessage.length).toBeGreaterThan(100);

      const result = sanitizeError(error, 200);

      const message = result.message as string;
      expect(message.length).toBeLessThanOrEqual(300); // 200 + marker
    });

    test('short message preserved exactly', () => {
      const error = createFetchErrorJsonRpcError();
      const result = sanitizeError(error);

      expect(result.message).toBe('execution reverted');
    });
  });

  // ----------------------------------------
  // INV-SE-6: nested error/cause recursion
  // ----------------------------------------
  describe('recursively sanitizes nested errors', () => {
    test('AllProvidersFailedError.cause is sanitized', () => {
      const error = createAllProvidersFailedError();
      const result = sanitizeError(error);

      expect(result.cause).toBeDefined();
      const cause = result.cause as Record<string, unknown>;
      expect(cause.constructor).toBe(Object);
      expect(cause.name).toBe('Error');
      expect(cause.code).toBe('SERVER_ERROR');
      expect(cause.reason).toBe('missing response');
      expect(cause).not.toHaveProperty('stack');
    });

    test('nested error chain (3 levels) is sanitized', () => {
      const error = createEthersNestedServerError();
      const result = sanitizeError(error);

      // outer
      expect(result.code).toBe('SERVER_ERROR');
      expect(result.reason).toBe('processing response error');

      // middle (via .error)
      const middle = result.error as Record<string, unknown>;
      expect(middle).toBeDefined();
      expect(middle.code).toBe('SERVER_ERROR');

      // inner serverError in middle is truncated (not recursive sanitizeError on serverError)
      expect(middle.serverError).toBeDefined();
    });

    test('AllProvidersFailedError with huge cause — cause data is truncated', () => {
      const hugeError = createEthersServerErrorWithHugeBody();
      const allFailed = new AllProvidersFailedError(
        'All attempts to do ETH1 RPC request failed for eth_getLogs',
      );
      allFailed.cause = hugeError;

      const result = sanitizeError(allFailed, 500);

      const cause = result.cause as Record<string, unknown>;
      const body = cause.body as string;
      expect(body.length).toBeLessThan(1000);
      expect(body).toContain('...[truncated');
    });
  });

  // ----------------------------------------
  // INV-SE-12: custom maxLength
  // ----------------------------------------
  describe('respects custom maxLength', () => {
    test('maxLength=50 truncates everything aggressively', () => {
      const error = createEthersServerErrorBatchChunk();
      const result = sanitizeError(error, 50);

      const requestBody = result.requestBody as string;
      expect(requestBody.length).toBeLessThan(150);
      expect(requestBody).toContain('...[truncated');

      const message = result.message as string;
      expect(message.length).toBeLessThan(150);
    });

    test('maxLength=10000 preserves small fields', () => {
      const error = createEthersServerError();
      const result = sanitizeError(error, 10000);

      // requestBody is ~175 chars — should be preserved
      expect(result.requestBody).toBe(
        (error as unknown as Record<string, unknown>).requestBody,
      );
    });
  });

  // ----------------------------------------
  // Coverage for every error mock
  // ----------------------------------------
  describe('works for every error mock type', () => {
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
      '%s — does not throw and returns bounded output',
      (_name, factory) => {
        const error = factory();
        const result = sanitizeError(error, 500);

        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result).not.toBeInstanceOf(Error);

        const totalSize = JSON.stringify(result).length;
        expect(totalSize).toBeLessThan(10000);
      },
    );
  });
});

describe('sanitizeErrorData', () => {
  // ----------------------------------------
  // INV-SD-1: small values preserved
  // ----------------------------------------
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

  // ----------------------------------------
  // INV-SD-2: string truncation
  // ----------------------------------------
  describe('truncates long strings', () => {
    test('string slightly over maxLength', () => {
      const str = 'x'.repeat(1100);
      const result = sanitizeErrorData(str) as string;

      expect(result.length).toBeLessThan(1200);
      expect(result).toContain('...[truncated, total length: 1100]');
    });

    test('string exactly at maxLength is preserved', () => {
      const str = 'x'.repeat(1000);
      const result = sanitizeErrorData(str);

      expect(result).toBe(str);
    });

    test('string one over maxLength is truncated', () => {
      const str = 'x'.repeat(1001);
      const result = sanitizeErrorData(str) as string;

      expect(result).toContain('...[truncated');
    });

    test('hex revert data (194 chars) preserved under default maxLength', () => {
      const hex =
        '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001a4e6f7420656e6f75676820616c6c6f77616e636500000000000000000000000000';
      const result = sanitizeErrorData(hex);

      expect(result).toBe(hex);
    });

    test('custom maxLength=50', () => {
      const str = 'y'.repeat(100);
      const result = sanitizeErrorData(str, 50) as string;

      expect(result).toContain('...[truncated, total length: 100]');
      expect(result.startsWith('y'.repeat(50))).toBe(true);
    });
  });

  // ----------------------------------------
  // INV-SD-3: object truncation
  // ----------------------------------------
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

  // ----------------------------------------
  // INV-SD-5: circular references
  // ----------------------------------------
  describe('handles circular references', () => {
    test('circular object returns [unserializable]', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj;

      const result = sanitizeErrorData(obj);
      expect(result).toBe('[unserializable]');
    });
  });

  // ----------------------------------------
  // INV-SD-6: truncation marker format
  // ----------------------------------------
  describe('truncation marker', () => {
    test('marker contains total length for strings', () => {
      const str = 'z'.repeat(5000);
      const result = sanitizeErrorData(str, 100) as string;

      expect(result).toContain('...[truncated, total length: 5000]');
    });

    test('marker contains total length for objects', () => {
      const obj = { data: 'x'.repeat(5000) };
      const jsonLen = JSON.stringify(obj).length;
      const result = sanitizeErrorData(obj, 100) as string;

      expect(result).toContain(`...[truncated, total length: ${jsonLen}]`);
    });
  });

  // ----------------------------------------
  // Real error data scenarios
  // ----------------------------------------
  describe('real error data scenarios', () => {
    test('batchResult.error (from UNEXPECTED_BATCH_RESULT)', () => {
      const data = { code: -32005, message: 'rate limit exceeded' };
      const result = sanitizeErrorData(data);

      expect(result).toEqual(data);
    });

    test('payload.error.data (huge revert data)', () => {
      const data = '0x' + 'ff'.repeat(10000); // 20002 chars
      const result = sanitizeErrorData(data, 500) as string;

      expect(result.length).toBeLessThan(1000);
      expect(result).toContain('...[truncated');
    });

    test('payload.error.data (small revert data)', () => {
      const data = '0x08c379a0';
      const result = sanitizeErrorData(data);

      expect(result).toBe(data);
    });

    test('partial batch result data (structured)', () => {
      const data = {
        requestedId: 7,
        receivedIds: [1, 2, 3, 4, 5, 6],
        batchSize: 6,
      };
      const result = sanitizeErrorData(data);

      expect(result).toEqual(data);
    });
  });
});

describe('sanitizeErrorInPlace', () => {
  // ----------------------------------------
  // INV-SIP-6: safe for null/undefined/non-object
  // ----------------------------------------
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

  // ----------------------------------------
  // INV-SIP-1: mutates in place
  // ----------------------------------------
  describe('mutates error in place', () => {
    test('returns void', () => {
      const error = createEthersServerError();
      const result = sanitizeErrorInPlace(error);

      expect(result).toBeUndefined();
    });

    test('same reference after sanitization', () => {
      const error = createEthersServerError();
      const ref = error;
      sanitizeErrorInPlace(error);

      expect(error).toBe(ref);
    });
  });

  // ----------------------------------------
  // INV-SIP-2: preserves instanceof
  // ----------------------------------------
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

  // ----------------------------------------
  // INV-SIP-3: truncates heavy fields
  // ----------------------------------------
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

          // instanceof must be preserved after mutation
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

  // ----------------------------------------
  // INV-SIP-5: preserves non-heavy fields
  // ----------------------------------------
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

      // sanitizeErrorInPlace should NOT remove stack — it only truncates heavy fields
      expect(error.stack).toBe(stackBefore);
    });
  });

  // ----------------------------------------
  // INV-SIP-4: recursive sanitization of nested error/cause
  // ----------------------------------------
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
      const middle = outer.error as Record<string, unknown>;
      const inner = middle.serverError as Record<string, unknown>;

      // inner has body field
      expect(inner.body).toBeDefined();

      sanitizeErrorInPlace(error, 30);

      // outer requestBody should be truncated
      const requestBody = outer.requestBody as string;
      expect(requestBody.length).toBeLessThan(150);

      // middle.serverError should also be sanitized (it's nested via .error -> .serverError)
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

  // ----------------------------------------
  // INV-SIP-7: after mutation, heavy fields are bounded
  // ----------------------------------------
  describe('heavy fields are bounded after mutation', () => {
    const MAX = 500;

    for (const [errorName, factory, fields] of INFLATABLE_ERRORS) {
      for (const [sizeName, sizeBytes] of SIZES) {
        test(`${errorName} inflated to ${sizeName} — all heavy fields bounded after mutation`, () => {
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

  // ----------------------------------------
  // Coverage for every error mock
  // ----------------------------------------
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
