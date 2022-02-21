import { Test } from '@nestjs/testing';
import {
  nullTransport,
  LoggerModule,
  LoggerService,
  LOGGER_PROVIDER,
} from '../src';

describe('Null transport', () => {
  const level = 'debug';
  const transports = nullTransport();

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
      expect(write).toBeCalledTimes(0);
    });

    test('Error', () => {
      const error = new Error(message);
      loggerService.error(error);
      expect(write).toBeCalledTimes(0);
    });

    test('Log', () => {
      loggerService.log(message);
      expect(write).toBeCalledTimes(0);
    });

    test('Verbose', () => {
      loggerService.verbose?.(message);
      expect(write).toBeCalledTimes(0);
    });

    test('Warn', () => {
      loggerService.warn(message);
      expect(write).toBeCalledTimes(0);
    });
  });
});
