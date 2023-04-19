import { Test } from '@nestjs/testing';
import {
  simpleTransport,
  jsonTransport,
  LoggerModule,
  LoggerService,
  LOGGER_PROVIDER,
  SECRET_REPLACER,
} from '../src';

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
      const replacer = SECRET_REPLACER;
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
        const expected = replacer;
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two secrets in error', () => {
        const message = secrets[0] + secrets[1];
        const expected = replacer + replacer;
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two identical secrets in error', () => {
        const message = secrets[0] + secrets[0];
        const expected = replacer + replacer;
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Single secret in log', () => {
        const message = secrets[0];
        const expected = replacer;
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
        const expected = replacer + replacer;
        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Address regex cleaning in error', () => {
        const message = secrets[4];
        const expected = replacer;

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two different addresses regex cleaning in error', () => {
        const message = secrets[4] + secrets[5];
        const expected = replacer + replacer;

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Two same addresses regex cleaning in error', () => {
        const message = secrets[5] + secrets[5];
        const expected = replacer + replacer;

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Address regex + another secret cleaning in error', () => {
        const message = secrets[4] + secrets[0];
        const expected = replacer + replacer;

        const error = new Error(message);
        loggerService.error(error);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Secret cleaning in log array', () => {
        const secret = secrets[0];
        const expected = replacer;

        loggerService.log([secret]);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });

      test('Address regex cleaning in log array', () => {
        const message = secrets[4];
        const expected = replacer;

        loggerService.log([message]);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(message));
      });

      test('Secret cleaning in simple object', () => {
        const secret = secrets[0];
        const expected = replacer;

        loggerService.log({ secret });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });

      test('Secret cleaning in deep object with methods', () => {
        const secret = secrets[0];
        const expected = replacer;

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
        const expected = replacer;

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

        // Depth: exactly 10
        const expectedLogItem = {
          a: {
            a: {
              a: {
                a: {
                  a: {
                    a: {
                      a: {
                        a: {
                          a: 'Maximum secret sanitizing depth reached.',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };

        loggerService.log(logItem);

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(
          expect.stringContaining(JSON.stringify(expectedLogItem)),
        );
        expect(write).toBeCalledWith(expect.not.stringContaining('Depth'));
      });

      test('Secret cleaning does not mutate original object', () => {
        const secret = secrets[0];
        const expected = replacer;

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
        const expected = replacer + replacer;

        loggerService.error({ test: secret });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining(expected));
        expect(write).toBeCalledWith(expect.not.stringContaining(secret));
      });
    });
  });
});
