const DEFAULT_MAX_LENGTH = 1000;

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
    const json = JSON.stringify(value);
    if (json.length <= maxLength) return value;
    return (
      json.slice(0, maxLength) + `...[truncated, total length: ${json.length}]`
    );
  } catch {
    return '[unserializable]';
  }
}

/**
 * Extracts safe, bounded error information from an error object.
 * Prevents huge RPC response data, ethers requestBody/body, and
 * nested error chains from bloating logs and memory.
 */
export function sanitizeError(
  error: unknown,
  maxLength = DEFAULT_MAX_LENGTH,
): Record<string, unknown> {
  if (error === null || error === undefined) {
    return { message: String(error) };
  }

  if (typeof error !== 'object') {
    return { message: truncate(String(error), maxLength) as string };
  }

  const err = error as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  if (err.name) sanitized.name = err.name;
  if (err.message) sanitized.message = truncate(err.message, maxLength);
  if (err.code !== undefined) sanitized.code = err.code;

  // ethers-specific fields — extract only useful metadata
  if (err.reason) sanitized.reason = truncate(err.reason, maxLength);
  if (err.method) sanitized.method = err.method;

  // truncate potentially huge fields
  if (err.data !== undefined) sanitized.data = truncate(err.data, maxLength);
  if (err.body !== undefined) sanitized.body = truncate(err.body, maxLength);
  if (err.requestBody !== undefined)
    sanitized.requestBody = truncate(err.requestBody, maxLength);
  if (err.serverError !== undefined)
    sanitized.serverError = truncate(err.serverError, maxLength);

  // recursively sanitize nested error/cause, but only one level
  if (err.error && typeof err.error === 'object') {
    sanitized.error = sanitizeError(err.error, maxLength);
  }
  if (err.cause && typeof err.cause === 'object') {
    sanitized.cause = sanitizeError(err.cause, maxLength);
  }

  // timeoutMs for RequestTimeoutError
  if (err.timeoutMs !== undefined) sanitized.timeoutMs = err.timeoutMs;

  return sanitized;
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
): void {
  if (error === null || error === undefined || typeof error !== 'object') {
    return;
  }

  const err = error as Record<string, unknown>;

  for (const field of HEAVY_FIELDS) {
    if (err[field] !== undefined) {
      err[field] = truncate(err[field], maxLength);
    }
  }

  // sanitize nested error/cause one level deep
  if (err.error && typeof err.error === 'object') {
    sanitizeErrorInPlace(err.error, maxLength);
  }
  if (err.cause && typeof err.cause === 'object') {
    sanitizeErrorInPlace(err.cause, maxLength);
  }
}
