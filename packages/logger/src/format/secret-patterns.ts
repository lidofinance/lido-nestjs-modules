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
 * header built from the userinfo. A URL with no key-like part, with a long part that does not
 * look random or with a short password is masked whole, as is any other secret.
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
      return [
        value,
        plain,
        encodeURIComponent(value),
        encodeURIComponent(plain),
      ];
    })
    .filter(isKeyLike);

  // A long part that does not look random may still be a key
  const unsure = raw
    .map(decode)
    .some((value) => value.length >= MIN_KEY_LENGTH && !isKeyLike(value));
  const password = decode(url.password);
  const whole =
    keys.length === 0 || unsure || (password !== '' && !isKeyLike(password));

  // Basic auth sends the userinfo even when only the username is set
  if (url.username || url.password) {
    const userinfo = `${decode(url.username)}:${password}`;
    keys.push(Buffer.from(userinfo).toString('base64'));
  }

  return [...new Set(whole ? [secret, ...keys] : keys)];
};

// Text can reach the mask already cut inside a secret. `sanitizeError` of `@lido-nestjs/execution`
// cuts a long RPC error, and ethers puts the endpoint URL after the request body. That function
// cannot mask first: `util.inspect` cuts each string while it walks the error, so the full text
// never exists in memory. Satanizer also cuts a long string before it matches. A piece shorter than
// 8 characters leaves most of a key hidden, and a shorter head would match unrelated text.
const MIN_PIECE_LENGTH = 8;

// The scheme is not secret, and `https://` alone would match every URL
const SCHEME = /^[a-z][a-z0-9+.-]*:(?=\/\/)/i;

// `-` is escaped too, for use inside a character class
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

/**
 * Matches what a cut leaves of a pattern string: its first `MIN_PIECE_LENGTH` characters, then any
 * run of characters that occur later in it. The run may go past the cut.
 */
export const piecePatterns = (pattern: string): RegExp[] => {
  const value = pattern.replace(SCHEME, '');
  if (value.length <= MIN_PIECE_LENGTH) return [];

  const head = escapeRegExp(value.slice(0, MIN_PIECE_LENGTH));
  const tail = escapeRegExp(
    [...new Set(value.slice(MIN_PIECE_LENGTH))].join(''),
  );
  return [new RegExp(`${head}[${tail}]*`)];
};
