import { Test } from '@nestjs/testing';
import {
  jsonTransport,
  LoggerModule,
  LoggerService,
  LOGGER_PROVIDER,
} from '../src';

describe('JSON transport', () => {
  const level = 'debug';
  const transports = jsonTransport();

  let loggerService: LoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ level, transports })],
    }).compile();

    loggerService = moduleRef.get(LOGGER_PROVIDER);
  });

  describe('Methods', () => {
    test('Methods should be defined', async () => {
      expect(loggerService.debug).toBeDefined();
      expect(loggerService.error).toBeDefined();
      expect(loggerService.log).toBeDefined();
      expect(loggerService.verbose).toBeDefined();
      expect(loggerService.warn).toBeDefined();
    });
  });

  describe('Output', () => {
    const message = 'foo bar';
    const write = jest.spyOn(process.stdout, 'write');

    beforeEach(() => write.mockImplementation(() => true));
    afterEach(() => write.mockReset());

    test('Debug', () => {
      const object = { level: 'debug', message };
      loggerService.debug?.(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('Error', () => {
      const error = new Error(message);
      const object = { level: 'error', message, stack: [error.stack] };
      loggerService.error(error);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('Log', () => {
      const object = { level: 'info', message };
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('Verbose', () => {
      const object = { level: 'verbose', message };
      loggerService.verbose?.(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('Warn', () => {
      const object = { level: 'warn', message };
      loggerService.warn(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('Array', () => {
      const object = { level: 'info', 0: message };

      loggerService.log([message]);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('Object', () => {
      const object = { level: 'info', message };

      loggerService.log(object);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });
  });

  describe('Context', () => {
    const message = 'foo';
    const context = 'baz';
    const write = jest.spyOn(process.stdout, 'write');

    beforeEach(() => write.mockImplementation(() => true));
    afterEach(() => write.mockReset());

    test('Log', () => {
      const object = { context, level: 'info', message };
      loggerService.log(message, context);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });
  });
});
