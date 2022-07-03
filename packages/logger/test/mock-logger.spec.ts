import { Test } from '@nestjs/testing';
import { LoggerService, LOGGER_PROVIDER, MockLoggerModule } from '../src';

describe('ForRoot', () => {
  let loggerService: LoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MockLoggerModule.forRoot({
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
        }),
      ],
    }).compile();

    loggerService = moduleRef.get(LOGGER_PROVIDER);
  });

  describe('Methods', () => {
    test('Methods should be defined', async () => {
      expect(loggerService.error).toBeDefined();
      expect(loggerService.log).toBeDefined();
      expect(loggerService.warn).toBeDefined();
    });

    test('Methods should be undefined', async () => {
      expect(loggerService.debug).toBeUndefined();
      expect(loggerService.verbose).toBeUndefined();
    });
  });
});

describe('ForRootAsync', () => {
  let loggerService: LoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MockLoggerModule.forRootAsync({
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
        }),
      ],
    }).compile();

    loggerService = moduleRef.get(LOGGER_PROVIDER);
  });

  describe('Methods', () => {
    test('Methods should be defined', async () => {
      expect(loggerService.error).toBeDefined();
      expect(loggerService.log).toBeDefined();
      expect(loggerService.warn).toBeDefined();
    });

    test('Methods should be undefined', async () => {
      expect(loggerService.debug).toBeUndefined();
      expect(loggerService.verbose).toBeUndefined();
    });
  });
});
