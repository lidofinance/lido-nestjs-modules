import { Test } from '@nestjs/testing';
import {
  cleanSecrets,
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

  test('Keeps symbol keys and masks all of them but the level', () => {
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

    expect(result.level).toBe('*****');
    expect(result.message).toBe('some ******');
    expect(result[LEVEL]).toBe('error');
    expect(result[SPLAT]).toEqual([{ token: '******' }]);
  });

  test('Masks nothing without secrets', () => {
    const info = { level: 'info', message: 'some secret' };

    expect(cleanSecrets().transform(info)).toEqual(info);
  });
});
