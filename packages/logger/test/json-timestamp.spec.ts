import { Test } from '@nestjs/testing';
import {
  jsonTransport,
  LoggerModule,
  LoggerService,
  LOGGER_PROVIDER,
} from '../src';
import fecha from 'fecha';

describe('JSON transport with timestamp', () => {
  const level = 'debug';
  const transports = jsonTransport({ timestamp: true });

  const now = () => fecha.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

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
      const timestamp = now();
      loggerService.debug?.(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
    });

    test('Error', () => {
      const error = new Error(message);
      const object = { level: 'error', message, stack: [error.stack] };
      const timestamp = now();
      loggerService.error(error);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
    });

    test('Log', () => {
      const object = { level: 'info', message };
      const timestamp = now();
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
    });

    test('Verbose', () => {
      const object = { level: 'verbose', message };
      const timestamp = now();
      loggerService.verbose?.(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
    });

    test('Warn', () => {
      const object = { level: 'warn', message };
      const timestamp = now();
      loggerService.warn(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
    });

    test('Array', () => {
      const object = { level: 'info', 0: message };
      const timestamp = now();
      loggerService.log([message]);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
    });

    test('Object', () => {
      const object = { level: 'info', message };
      const timestamp = now();
      loggerService.log(object);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
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
      const timestamp = now();
      loggerService.log(message, context);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(
        JSON.stringify({ ...object, timestamp }) + '\n',
      );
    });
  });
});
