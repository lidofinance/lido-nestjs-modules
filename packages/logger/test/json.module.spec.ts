import { Test } from '@nestjs/testing';
import { LoggerService } from '@nestjs/common';
import { jsonTransport, LoggerModule, LOGGER_PROVIDER } from '../src';

describe('Logger. JSON transport', () => {
  const level = 'debug';
  const transports = jsonTransport();

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
      const object = { level: 'debug', message };
      loggerService.debug(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('error', () => {
      const error = new Error(message);
      const object = { level: 'error', message, stack: [error.stack] };
      loggerService.error(error);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('log', () => {
      const object = { level: 'info', message };
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('verbose', () => {
      const object = { level: 'verbose', message };
      loggerService.verbose(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('warn', () => {
      const object = { level: 'warn', message };
      loggerService.warn(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });
  });

  describe('context', () => {
    const message = 'foo';
    const context = 'baz';
    const write = jest.spyOn(process.stdout, 'write');

    beforeEach(() => write.mockImplementation(() => void 0));
    afterEach(() => write.mockReset());

    test('log', () => {
      const object = { context, level: 'info', message };
      loggerService.log(message, context);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });
  });
});
