import {
  REDACTED_URL,
  redactConnectionSecrets,
  redactUrl,
} from '../src/common/redact-url';
import { findPiece, secretEndpoints } from './fixtures/secret-endpoints';

const urlError = (url: string) => {
  const error = new Error(
    `bad response (status=500, requestBody="{}", url=${JSON.stringify(url)})`,
  ) as Error & Record<string, unknown>;
  error.url = url;
  error.code = 'SERVER_ERROR';
  return error;
};

const allStrings = (error: Error & Record<string, unknown>) =>
  [error.message, error.stack, error.url].join('\n');

describe('redactUrl', () => {
  test.each([
    [
      'https://eth-mainnet.g.alchemy.com/v2/AlchFAKEk3yQ9xZ2mN7pL4wR8tY1uV',
      'https://***.alchemy.com/***',
    ],
    [
      'https://lb.drpc.org/ogrpc?network=ethereum&dkey=DrpcFAKEdkeyAbCdEfGhIjKlMnOp',
      'https://***.drpc.org/***',
    ],
    ['https://user:Passw0rd@rpc.example.com/', 'https://***.example.com/***'],
    ['https://TOKENonly@rpc.example.com/', 'https://***.example.com/***'],
    ['http://cl-node:5052/eth', 'http://cl-node:5052/***'],
    ['http://127.0.0.1:8545', 'http://127.0.0.1:8545'],
    ['http://127.0.0.1:8545/v2/somekey', 'http://127.0.0.1:8545/***'],
    ['http://[::1]:8545/x', 'http://[::1]:8545/***'],
    ['http://localhost:8545', 'http://localhost:8545'],
    ['https://cloudflare-eth.com/v1/mainnet', 'https://cloudflare-eth.com/***'],
    [
      'http://abc123def456-rpc-3-mainnet-erigon.tooling-nodes.example.fi',
      'http://***.example.fi',
    ],
    [
      'https://rpc.example.com/v2/shortKey15chars',
      'https://***.example.com/***',
    ],
    [
      'wss://mainnet.infura.io/ws/v3/9f1e2d3c4b5a69788776655443322110',
      'wss://***.infura.io/***',
    ],
    ['not a url AlchFAKEk3yQ9xZ2mN7pL4wR8tY1uV', REDACTED_URL],
  ])('%s', (url, expected) => {
    expect(redactUrl(url)).toBe(expected);
  });

  test.each(secretEndpoints)('%s endpoint hides the key', (_, url, key) => {
    const redacted = redactUrl(url);
    expect(redacted).toContain('***');
    expect(redacted).toMatch(/^[a-z]+:\/\/(\*\*\*\.)?[^/*]+(\/\*\*\*)?$/);
    expect(findPiece(redacted, key)).toBeUndefined();
  });
});

describe('redactConnectionSecrets', () => {
  test.each(secretEndpoints)(
    '%s: url, message and stack are clean',
    (_, url, key) => {
      const error = urlError(url);
      const result = redactConnectionSecrets(error, url);

      expect(result).toBe(error);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.url).toBe(redactUrl(url));
      expect(error.message).toContain(redactUrl(url));
      expect(error.stack).toContain(redactUrl(url));
      expect(findPiece(allStrings(error), key)).toBeUndefined();
    },
  );

  test('takes the URL from ConnectionInfo', () => {
    const [, url] = secretEndpoints[0];
    const error = urlError(url);

    redactConnectionSecrets(error, { url, timeout: 1000 });

    expect(error.url).toBe(redactUrl(url));
  });

  test('URL without a path stays as is', () => {
    const url = 'http://127.0.0.1:8545';
    const error = urlError(url);
    const message = error.message;

    redactConnectionSecrets(error, url);

    expect(error.url).toBe(url);
    expect(error.message).toBe(message);
  });

  test('unparsable URL is replaced by a placeholder', () => {
    const url = 'not a url AlchFAKEk3yQ9xZ2mN7pL4wR8tY1uV';
    const error = urlError(url);

    redactConnectionSecrets(error, url);

    expect(error.url).toBe(REDACTED_URL);
    expect(error.message).toContain(REDACTED_URL);
    expect(error.message).not.toContain('AlchFAKE');
  });

  test('frozen error and throwing getter do not throw', () => {
    const [, url] = secretEndpoints[0];
    const frozen = Object.freeze(urlError(url));
    expect(redactConnectionSecrets(frozen, url)).toBe(frozen);
    expect(frozen.url).toBe(url);

    const error = urlError(url);
    Object.defineProperty(error, 'message', {
      get() {
        throw new Error('getter');
      },
    });
    expect(redactConnectionSecrets(error, url)).toBe(error);
    expect(error.url).toBe(redactUrl(url));
  });

  test('non-object errors and an empty URL are returned as is', () => {
    const [, url] = secretEndpoints[0];
    expect(redactConnectionSecrets(`failed ${url}`, url)).toBe(`failed ${url}`);
    expect(redactConnectionSecrets(null, url)).toBeNull();

    const error = new Error(url);
    expect(redactConnectionSecrets(error, { url: '' })).toBe(error);
    expect(error.message).toBe(url);
  });
});
