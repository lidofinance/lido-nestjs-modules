import { Test } from '@nestjs/testing';
import {
  simpleTransport,
  LoggerModule,
  LoggerService,
  LOGGER_PROVIDER,
} from '../src';

describe('Simple transport', () => {
  const level = 'debug';
  const transports = simpleTransport();

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
      loggerService.debug?.(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('debug'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('Error', () => {
      const error = new Error(message);
      loggerService.error(error);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('error'));
      expect(write).toBeCalledWith(
        expect.stringContaining(String(error.stack)),
      );
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('Log', () => {
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('info'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('Verbose', () => {
      loggerService.verbose?.(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('verbose'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('Warn', () => {
      loggerService.warn(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('warn'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('Array', () => {
      loggerService.debug?.([message]);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('debug'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });

    test('Object', () => {
      loggerService.debug?.({ key: message });

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('debug'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
    });
  });

  describe('Context', () => {
    const message = 'foo';
    const context = 'baz';
    const write = jest.spyOn(process.stdout, 'write');

    beforeEach(() => write.mockImplementation(() => true));
    afterEach(() => write.mockReset());

    test('Log', () => {
      loggerService.log(message, context);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining('info'));
      expect(write).toBeCalledWith(expect.stringContaining(message));
      expect(write).toBeCalledWith(expect.stringContaining(context));
    });
  });
});
