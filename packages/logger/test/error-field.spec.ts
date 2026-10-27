import { Test } from '@nestjs/testing';
import {
  simpleTransport,
  jsonTransport,
  LoggerModule,
  LoggerService,
  LOGGER_PROVIDER,
} from '../src';

describe('Error field', () => {
  const level = 'debug';
  const message = 'foo bar';
  const write = jest.spyOn(process.stdout, 'write');

  beforeEach(() => write.mockImplementation(() => true));
  afterEach(() => write.mockReset());

  const createLogger = async (
    transports: ReturnType<typeof jsonTransport>,
  ): Promise<LoggerService> => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ level, transports })],
    }).compile();

    return moduleRef.get(LOGGER_PROVIDER);
  };

  const transports = {
    json: jsonTransport,
    simple: simpleTransport,
  };

  Object.entries(transports).forEach(([name, transport]) => {
    describe(`Transport: ${name}`, () => {
      test('Omitted by default', async () => {
        const loggerService = await createLogger(transport());
        loggerService.error(new Error(message));

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.not.stringContaining('"error":'));
      });

      test('Included with includeErrorField', async () => {
        const loggerService = await createLogger(
          transport({ includeErrorField: true }),
        );
        loggerService.error(new Error(message));

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining('"error":'));
      });

      test('User error field is kept', async () => {
        const loggerService = await createLogger(transport());
        loggerService.error({ message, error: 'baz' });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining('"error":"baz"'));
      });

      test('User error field with another Error is kept', async () => {
        const loggerService = await createLogger(transport());
        loggerService.error({ message, error: new Error('baz') });

        expect(write).toBeCalledTimes(1);
        expect(write).toBeCalledWith(expect.stringContaining('"error":'));
      });
    });
  });
});
