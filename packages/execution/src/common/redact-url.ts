import { isIP } from 'net';
import { ConnectionInfo } from '@ethersproject/web';

const REDACTED = '***';
export const REDACTED_URL = '[redacted url]';

/**
 * Keeps the scheme, the last two host labels and the port; the rest is `***`.
 */
export const redactUrl = (url: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return REDACTED_URL;
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  const labels = hostname.split('.');
  const host =
    isIP(hostname) || labels.length <= 2
      ? parsed.hostname
      : `${REDACTED}.${labels.slice(-2).join('.')}`;
  const port = parsed.port ? `:${parsed.port}` : '';
  const hasMore =
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== '' && parsed.pathname !== '/') ||
    parsed.search ||
    parsed.hash;

  return `${parsed.protocol}//${host}${port}${hasMore ? `/${REDACTED}` : ''}`;
};

/**
 * Replaces the connection URL with its redacted form in the error's
 * `url`, `message` and `stack`: the only places ethers puts it.
 * Mutates in place, returns the same error, never throws.
 */
export const redactConnectionSecrets = <T>(
  error: T,
  connection: string | ConnectionInfo,
): T => {
  const url = typeof connection === 'string' ? connection : connection.url;
  if (!url || typeof error !== 'object' || error === null) return error;

  const redacted = redactUrl(url);
  const target = error as Record<string, unknown>;
  for (const key of ['url', 'message', 'stack']) {
    try {
      const value = target[key];
      if (typeof value === 'string' && value.includes(url)) {
        target[key] = value.split(url).join(redacted);
      }
    } catch {
      // read-only property or throwing getter
    }
  }
  return error;
};
