import { Test } from '@nestjs/testing';
import {
  cleanSecrets,
  secretsMask,
  simpleTransport,
  jsonTransport,
  LoggerModule,
  LoggerService,
  LOGGER_PROVIDER,
} from '../src';

const masked = (text: string) => '*'.repeat(text.length);

describe('Hide secrets', () => {
  const transports = {
    simple: simpleTransport,
    json: jsonTransport,
  };

  Object.entries(transports).forEach(([name, transport]) => {
    describe(`Transport: ${name}`, () => {
      const write = jest.spyOn(process.stdout, 'write');
      const emptyString = '';
      const specialCharactersRegex = '-[]{}()/\\^$.|?*+';
      const secrets = [
        'hidden-address-1',
        '[hidden-address-2',
        emptyString,
        specialCharactersRegex,
        '0x0000000000000000000000000000000000000000',
        '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      ];
      const regex = [/(0x)?[0-9a-fA-F]{40}/];
      const level = 'debug';
      const transports = transport({ secrets, regex });

      let loggerService: LoggerService;

      beforeEach(() => write.mockImplementation(() => true));
      afterEach(() => write.mockReset());

      beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot({ level, transports })],
        }).compile();

        loggerService = moduleRef.get(LOGGER_PROVIDER);
      });

      test('Single secret in error', () => {
        const message = secrets[0];
        const expected = masked(message);
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two secrets in error', () => {
        const message = secrets[0] + secrets[1];
        const expected = masked(message);
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two identical secrets in error', () => {
        const message = secrets[0] + secrets[0];
        const expected = masked(message);
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Single secret in log', () => {
        const message = secrets[0];
        const expected = masked(message);
        loggerService.log(message);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Single secret with regex special characters in error', () => {
        const message =
          secrets[0] +
          specialCharactersRegex +
          secrets[1] +
          specialCharactersRegex;
        const expected = masked(message);
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Address regex cleaning in error', () => {
        const message = secrets[4];
        const expected = masked(message);

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two different addresses regex cleaning in error', () => {
        const message = secrets[4] + secrets[5];
        const expected = masked(message);

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two same addresses regex cleaning in error', () => {
        const message = secrets[5] + secrets[5];
        const expected = masked(message);

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Address regex + another secret cleaning in error', () => {
        const message = secrets[4] + secrets[0];
        const expected = masked(message);

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Secret cleaning in log array', () => {
        const secret = secrets[0];
        const expected = masked(secret);

        loggerService.log([secret]);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });

      test('Address regex cleaning in log array', () => {
        const message = secrets[4];
        const expected = masked(message);

        loggerService.log([message]);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Secret cleaning in simple object', () => {
        const secret = secrets[0];
        const expected = masked(secret);

        loggerService.log({ secret });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });

      test('Secret cleaning in deep object with methods', () => {
        const secret = secrets[0];
        const expected = masked(secret);

        loggerService.log({
          x: 'x',
          y: { a: 1, 2: [secret], fn: () => secret },
        });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });

      test('Secret cleaning in deep object', () => {
        const secret = secrets[0];
        const expected = masked(secret);

        loggerService.log({ x: 'x', y: { a: 1, 2: secret } });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });

      test('Secret cleaning in super deep object', () => {
        // Depth: > 10
        const logItem = {
          a: {
            a: {
              a: {
                a: { a: { a: { a: { a: { a: { a: { a: 'Depth' } } } } } } },
              },
            },
          },
        };

        // The log entry is level 0, so the 10th nested object is cut
        const expectedLogItem = {
          a: {
            a: {
              a: {
                a: { a: { a: { a: { a: { a: { a: '[MaxDepth]' } } } } } },
              },
            },
          },
        };

        loggerService.log(logItem);

        expect(write).toBeCalledTimes(1);
        // The JSON transport puts more fields next to the item, so match it without braces
        expect(write).toBeCalledWith(
          expect.stringContaining(JSON.stringify(expectedLogItem).slice(1, -1)),
        );
        expect(write).toBeCalledWith(expect.not.stringContaining('"Depth"'));
      });

      test('Secret cleaning does not mutate original object', () => {
        const secret = secrets[0];
        const expected = masked(secret);

        const originalObj = { x: 'x', y: { z: { a: 1, 2: secret } } };
        const obj = { x: 'x', y: { z: { a: 1, 2: secret } } };

        loggerService.log(obj);

        expect(obj === originalObj).toBe(false);
        expect(obj).toStrictEqual(originalObj);
        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });

      test('Address regex + another secret cleaning in object', () => {
        const secret = secrets[0] + secrets[4];
        const expected = masked(secret);

        loggerService.error({ test: secret });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });
    });
  });
});

describe('cleanSecrets format', () => {
  const LEVEL = Symbol.for('level');
  const SPLAT = Symbol.for('splat');

  test('Keeps symbol keys and masks everything but the level', () => {
    const format = cleanSecrets({ secrets: ['error', 'secret'] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info: any = {
      level: 'error',
      message: 'some secret',
      [LEVEL]: 'error',
      [SPLAT]: [{ token: 'secret' }],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = format.transform(info);

    expect(result.level).toBe('error');
    expect(result.message).toBe('some ******');
    expect(result[LEVEL]).toBe('error');
    expect(result[SPLAT]).toEqual([{ token: '******' }]);
  });

  test('Keeps the level and the message after a large payload', () => {
    const format = cleanSecrets({ secrets: ['secret'] });
    const items = Array.from({ length: 900 }, (_, item) =>
      Object.fromEntries(
        Array.from({ length: 20 }, (_, field) => [`f${field}`, item]),
      ),
    );
    // winston puts the extra arguments before the level and the message
    const result = format.transform({
      stack: [{ items }],
      level: 'error',
      message: 'some secret',
    });

    expect(result).toMatchObject({ level: 'error', message: 'some ******' });
  });

  test('Exports the same mask for use outside the logger', () => {
    const endpoint = 'https://rpc.example.com/v2/AbCdEf0123456789XyZ';
    const mask = secretsMask({ secrets: [endpoint], regex: [/0x[0-9a-f]{4}/] });

    expect(mask({ url: endpoint, data: ['0xabcd'] })).toEqual({
      url: `https://rpc.example.com/v2/${masked('AbCdEf0123456789XyZ')}`,
      data: ['******'],
    });
  });

  test('Masks nothing without secrets', () => {
    const info = { level: 'info', message: 'some secret' };

    expect(cleanSecrets().transform(info)).toEqual(info);
    expect(secretsMask()(info)).toEqual(info);
  });
});

describe('Secret URLs', () => {
  // Fake keys in the shapes RPC providers hand out
  const endpoints = [
    [
      'alchemy',
      'https://eth-mainnet.g.alchemy.com/v2/AlchFAKEk3yQ9xZ2mN7pL4wR8tY1uV',
      'AlchFAKEk3yQ9xZ2mN7pL4wR8tY1uV',
    ],
    [
      'infura',
      'https://mainnet.infura.io/v3/9f1e2d3c4b5a69788776655443322110',
      '9f1e2d3c4b5a69788776655443322110',
    ],
    [
      'drpc query',
      'https://lb.drpc.org/ogrpc?network=ethereum&dkey=DrpcFAKEdkeyAbCdEfGhIjKlMnOp',
      'DrpcFAKEdkeyAbCdEfGhIjKlMnOp',
    ],
    [
      'drpc path',
      'https://lb.drpc.live/ethereum/DrpcFAKEpathKeyQrStUvWxYz012',
      'DrpcFAKEpathKeyQrStUvWxYz012',
    ],
    [
      'chainstack',
      'https://ethereum-mainnet.core.chainstack.com/c0ffeec0ffeec0ffeec0ffeec0ffee12',
      'c0ffeec0ffeec0ffeec0ffeec0ffee12',
    ],
    [
      'quicknode',
      'https://fake-name.quiknode.pro/qnFAKEtokenaabbccddeeff00112233/',
      'qnFAKEtokenaabbccddeeff00112233',
    ],
    [
      'ankr',
      'https://rpc.ankr.com/eth/ankrFAKE0123456789abcdef0123456789abcdef',
      'ankrFAKE0123456789abcdef0123456789abcdef',
    ],
    [
      'blast',
      'https://eth-mainnet.blastapi.io/5a5a5a5a-FAKE-4b4b-8c8c-0d0d0d0d0d0d',
      '5a5a5a5a-FAKE-4b4b-8c8c-0d0d0d0d0d0d',
    ],
  ];

  const transform = (secrets: string[], info: Record<string, unknown>) =>
    JSON.stringify(
      cleanSecrets({ secrets }).transform({
        level: 'error',
        message: '',
        ...info,
      }),
    );

  test.each(endpoints)(
    'Masks the %s key logged without the rest of the URL',
    (_, endpoint, key) => {
      const url = new URL(endpoint);
      const logged = transform([endpoint], {
        message: `POST ${url.pathname}${url.search} HTTP/1.1`,
        encoded: encodeURIComponent(endpoint),
        key,
      });

      expect(logged).not.toContain(key);
      expect(logged).toContain(masked(key));
    },
  );

  test.each(endpoints)(
    'Keeps the %s host readable and masks the key',
    (_, endpoint, key) => {
      const logged = transform([endpoint], {
        message: `request to ${endpoint} failed`,
      });

      expect(logged).toContain(
        `request to ${endpoint.replace(key, masked(key))} failed`,
      );
    },
  );

  test.each([
    ['without a key-like part', 'http://cl-node:5052/eth'],
    ['with a short password', 'https://user:Pass1@rpc.example.com/'],
    ['written not as parsed', 'HTTPS://rpc.example.com/AbCdEf0123456789XyZ'],
    [
      'with a long part that does not look random',
      'https://rpc.example.com/AbCdEf0123456789XyZ/abcdefghijklmnopq',
    ],
    ['with a short username only', 'https://user@rpc.example.com/'],
  ])('Masks a URL %s whole', (_, endpoint) => {
    const logged = transform([endpoint], { message: `GET ${endpoint}` });

    expect(logged).toContain(`GET ${masked(endpoint)}`);
  });

  test.each([
    ['https://rpc.example.com/AbCd:Ef0123456789XyZ'],
    ['https://rpc.example.com/AbCdEf0123456789%2FXyZ'],
  ])('Masks the key of %s in a URL-encoded URL', (endpoint) => {
    const host = encodeURIComponent('https://rpc.example.com/');
    const encoded = encodeURIComponent(endpoint);
    const logged = transform([endpoint], { message: encoded });

    expect(logged).toContain(host + masked(encoded.slice(host.length)));
  });

  test('Masks a key with a malformed escape as written', () => {
    const endpoint = 'https://rpc.example.com/AbCdEf0123456789%ZZ';
    const logged = transform([endpoint], { message: endpoint });

    expect(logged).toContain(
      `https://rpc.example.com/${masked('AbCdEf0123456789%ZZ')}`,
    );
  });

  test('Masks a key passed as the username', () => {
    const endpoint = 'https://AbCdEf0123456789XyZ@rpc.example.com/';
    const header = `Basic ${Buffer.from('AbCdEf0123456789XyZ:').toString(
      'base64',
    )}`;
    const logged = transform([endpoint], {
      message: endpoint,
      headers: { authorization: header },
    });

    expect(logged).toContain(
      `https://${masked('AbCdEf0123456789XyZ')}@rpc.example.com/`,
    );
    expect(logged).not.toContain(header.slice(6));
  });

  test('Masks basic auth credentials in an Authorization header', () => {
    const endpoint =
      'https://user-name:csFAKEpassw0rdXyZ012@ethereum-mainnet.core.chainstack.com/';
    const header = `Basic ${Buffer.from(
      'user-name:csFAKEpassw0rdXyZ012',
    ).toString('base64')}`;
    const logged = transform([endpoint], {
      headers: { authorization: header },
      password: 'csFAKEpassw0rdXyZ012',
    });

    expect(logged).not.toContain(header.slice(6));
    expect(logged).not.toContain('csFAKEpassw0rdXyZ012');
  });

  test('Keeps short and plain path segments readable', () => {
    const logged = transform(
      [
        'http://cl-node:5052/eth',
        'https://rpc.example.com/ethereum-mainnet/v1',
      ],
      {
        message: 'GET /eth/v1/beacon/genesis from ethereum-mainnet',
      },
    );

    expect(logged).toContain(
      'GET /eth/v1/beacon/genesis from ethereum-mainnet',
    );
  });

  test('Takes parts from http and ws URLs only', () => {
    const secret = 'token:AbCdEf0123456789XyZ';
    const logged = transform([secret], { message: 'AbCdEf0123456789XyZ' });

    expect(logged).toContain('AbCdEf0123456789XyZ');
  });
});
