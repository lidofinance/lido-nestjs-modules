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
      ];
      const replacer = SECRET_REPLACER;
      const level = 'debug';
      const transports = transport({ secrets });

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
    });
  });
});
