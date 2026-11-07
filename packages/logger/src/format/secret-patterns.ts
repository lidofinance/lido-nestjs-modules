// A provider key is usually 20 to 64 random characters. Shorter pieces and plain words such as
// "ethereum-mainnet" stay readable: masking them would hide the same words in every log line.
const MIN_KEY_LENGTH = 16;
const LOOKS_RANDOM = /[0-9A-Z]/;

const URL_SCHEMES = new Set(['http:', 'https:', 'ws:', 'wss:']);

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const isKeyLike = (value: string): boolean =>
  value.length >= MIN_KEY_LENGTH && LOOKS_RANDOM.test(value);

const parseUrl = (secret: string): URL | undefined => {
  try {
    const url = new URL(secret);
    if (!URL_SCHEMES.has(url.protocol)) return undefined;
    // Parts are cut from the normalised URL; a secret written differently may carry them in
    // another spelling
    return url.href === secret || url.href === `${secret}/` ? url : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Strings to mask for one secret. For an endpoint URL these are its key parts, so the host stays
 * readable. Clients also log the parts alone: a request path, a query value, an Authorization
 * header built from the userinfo. A URL with no key-like part, or with a short password, is
 * masked whole, as is any other secret.
 */
export const secretPatterns = (secret: string): string[] => {
  const url = parseUrl(secret);
  if (!url) return [secret];

  const query = url.search
    .slice(1)
    .split('&')
    .map((pair) => pair.slice(pair.indexOf('=') + 1));
  const raw = [
    ...url.pathname.split('/'),
    ...query,
    url.username,
    url.password,
  ];
  const keys = raw
    .flatMap((value) => {
      const plain = decode(value);
      return [value, plain, encodeURIComponent(plain)];
    })
    .filter(isKeyLike);

  const password = decode(url.password);
  if (password) {
    const userinfo = `${decode(url.username)}:${password}`;
    keys.push(Buffer.from(userinfo).toString('base64'));
  }

  const whole = keys.length === 0 || (password !== '' && !isKeyLike(password));
  return [...new Set(whole ? [secret, ...keys] : keys)];
};
