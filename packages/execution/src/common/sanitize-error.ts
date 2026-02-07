import { inspect } from 'util';

const DEFAULT_MAX_LENGTH = 1000;

const INSPECT_OPTIONS = (maxLength: number) =>
  ({
    depth: 4,
    maxStringLength: maxLength,
    maxArrayLength: 20,
    compact: true,
    breakLength: Infinity,
  } as const);

/**
 * Uses util.inspect to produce a bounded string representation.
 * Never calls JSON.stringify (avoids V8 "RangeError: Invalid string length"
 * on objects >512 MB). inspect() handles circular references, throwing
 * getters, frozen objects, and huge data internally.
 */
function truncate(value: unknown, maxLength: number): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.length > maxLength
      ? value.slice(0, maxLength) +
          `...[truncated, total length: ${value.length}]`
      : value;
  }
  if (typeof value !== 'object') return value;

  try {
    const inspected = inspect(value, INSPECT_OPTIONS(maxLength));
    if (inspected.length <= maxLength) return value;

    return (
      inspected.slice(0, maxLength) +
      `...[truncated, total length: ${inspected.length}]`
    );
  } catch {
    return '[unserializable]';
  }
}

/**
 * Returns a safe, bounded string representation of an error for logging.
 * inspect() handles everything internally: circular references, throwing
 * getters, frozen objects, huge nested data. No manual field extraction needed.
 */
export function sanitizeError(
  error: unknown,
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  try {
    const result = inspect(error, INSPECT_OPTIONS(maxLength));
    if (result.length <= maxLength) return result;

    return (
      result.slice(0, maxLength) +
      `...[truncated, total length: ${result.length}]`
    );
  } catch {
    return '[unserializable error]';
  }
}

/**
 * Truncates unknown data to a safe size.
 * Use for FetchError.data assignment to prevent huge RPC payloads
 * from being attached to error objects.
 */
export function sanitizeErrorData(
  data: unknown,
  maxLength = DEFAULT_MAX_LENGTH,
): unknown {
  return truncate(data, maxLength);
}

const HEAVY_FIELDS = ['data', 'body', 'requestBody', 'serverError'] as const;

/**
 * Mutates the error object in place, truncating heavy fields.
 * Preserves the original error type (instanceof checks still work).
 * Use for error objects that are thrown to consumers (e.g. AllProvidersFailedError.cause).
 */
export function sanitizeErrorInPlace(
  error: unknown,
  maxLength = DEFAULT_MAX_LENGTH,
  /** @internal tracks visited objects to prevent circular-reference stack overflow */
  _seen?: WeakSet<object>,
): void {
  if (error === null || error === undefined || typeof error !== 'object') {
    return;
  }

  const seen = _seen ?? new WeakSet<object>();
  if (seen.has(error)) return;
  seen.add(error);

  const err = error as Record<string, unknown>;

  for (const field of HEAVY_FIELDS) {
    try {
      if (err[field] !== undefined) {
        err[field] = truncate(err[field], maxLength);
      }
    } catch {
      // read-only property or throwing getter
    }
  }

  try {
    if (err.error && typeof err.error === 'object') {
      sanitizeErrorInPlace(err.error, maxLength, seen);
    }
  } catch {
    // throwing getter on .error
  }

  try {
    if (err.cause && typeof err.cause === 'object') {
      sanitizeErrorInPlace(err.cause, maxLength, seen);
    }
  } catch {
    // throwing getter on .cause
  }
}
