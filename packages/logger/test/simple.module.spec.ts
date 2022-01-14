import { Test } from '@nestjs/testing';
import { LoggerService } from '@nestjs/common';
import { simpleTransport, LoggerModule, LOGGER_PROVIDER } from '../src';

describe('Logger. Simple transport', () => {
  const level = 'debug';
  const transports = simpleTransport();

  let loggerService: LoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ level, transports })],
    }).compile();

    loggerService = moduleRef.get(LOGGER_PROVIDER);
  });

  describe('methods', () => {
    test('methods should be defined', async () => {
      expect(loggerService.debug).toBeDefined();
      expect(loggerService.error).toBeDefined();
      expect(loggerService.log).toBeDefined();
      expect(loggerService.verbose).toBeDefined();
      expect(loggerService.warn).toBeDefined();
    });
  });

  describe('output', () => {
    const message = 'foo bar';
    const write = jest.spyOn(process.stdout, 'write');

    beforeEach(() => write.mockImplementation(() => void 0));
    afterEach(() => write.mockReset());

    test('debug', () => {
      loggerService.debug(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('debug'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('error', () => {
      const error = new Error(message);
      loggerService.error(error);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('error'));
      expect(write).toBeCalledWith(expect.stringContaining(error.stack));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('log', () => {
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('info'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('verbose', () => {
      loggerService.verbose(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('verbose'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('warn', () => {
      loggerService.warn(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('warn'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });
  });

  describe('context', () => {
    const message = 'foo';
    const context = 'baz';
    const write = jest.spyOn(process.stdout, 'write');

    beforeEach(() => write.mockImplementation(() => void 0));
    afterEach(() => write.mockReset());

    test('log', () => {
      loggerService.log(message, context);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('info'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
      expect(write).toBeCalledWith(expect.stringContaining(context));
    });
  });
});
