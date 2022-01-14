import { Test } from '@nestjs/testing';
import { LoggerService } from '@nestjs/common';
import {
  simpleTransport,
  jsonTransport,
  LoggerModule,
  LOGGER_PROVIDER,
} from '../src';

describe('Logger. Meta fields', () => {
  const level = 'debug';
  const defaultMeta = { baz: 'qux' };
  const message = 'foo bar';
  const write = jest.spyOn(process.stdout, 'write');

  beforeEach(() => write.mockImplementation(() => void 0));
  afterEach(() => write.mockReset());

  let loggerService: LoggerService;

  describe('JSON transport', () => {
    const transports = jsonTransport();

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [LoggerModule.forRoot({ level, defaultMeta, transports })],
      }).compile();

      loggerService = moduleRef.get(LOGGER_PROVIDER);
    });

    test('meta data in log', async () => {
      const object = { ...defaultMeta, level: 'info', message };
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });

    test('meta data in error', async () => {
      const error = new Error(message);
      const object = {
        ...defaultMeta,
        level: 'error',
        message,
        stack: [error.stack],
      };
      loggerService.error(error);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(JSON.stringify(object) + '\n');
    });
  });

  describe('SImple transport', () => {
    const transports = simpleTransport({ fieldColors: { baz: 'blue' } });

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [LoggerModule.forRoot({ level, defaultMeta, transports })],
      }).compile();

      loggerService = moduleRef.get(LOGGER_PROVIDER);
    });

    test('meta data in log', async () => {
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining(defaultMeta.baz));
    });

    test('meta data in error', async () => {
      loggerService.log(message);

      expect(write).toBeCalledTimes(1);
      expect(write).toBeCalledWith(expect.stringContaining(defaultMeta.baz));
    });
  });
});
