import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  ExecutionModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import { fakeFetchImpl } from './fixtures/fake-json-rpc';
import { LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';

export type MockedExtendedJsonRpcBatchProvider =
  ExtendedJsonRpcBatchProvider & {
    fetchJson: (
      connection: string | ConnectionInfo,
      json?: string,
    ) => Promise<unknown>;
  };

type MockedSimpleFallbackJsonRpcBatchProvider =
  SimpleFallbackJsonRpcBatchProvider & {
    fallbackProviders: [
      { provider: MockedExtendedJsonRpcBatchProvider; valid: boolean },
    ];
  };

describe('Execution module. ', () => {
  describe('SimpleFallbackJsonRpcBatchProvider', () => {
    let mockedProvider: MockedSimpleFallbackJsonRpcBatchProvider;
    let mockedProviderDetectNetwork: jest.SpyInstance;
    const mockedFallbackProviderFetch: jest.SpyInstance[] = [];
    const mockedFallbackDetectNetwork: jest.SpyInstance[] = [];

    const createMocks = async (
      jsonRpcMaxBatchSize: number,
      maxConcurrentRequests: number,
    ) => {
      const module = {
        imports: [
          ExecutionModule.forFeature({
            imports: [LoggerModule.forRoot({})],
            urls: ['http://localhost:10000', 'http://localhost:10001'],
            requestPolicy: {
              jsonRpcMaxBatchSize,
              batchAggregationWaitMs: 10,
              maxConcurrentRequests,
            },
            network: 1,
            maxRetries: 1,
            logRetries: false,
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(SimpleFallbackJsonRpcBatchProvider);

      mockedFallbackProviderFetch[0] = jest
        .spyOn(mockedProvider.fallbackProviders[0].provider, 'fetchJson')
        .mockImplementation(fakeFetchImpl);

      mockedFallbackProviderFetch[1] = jest
        .spyOn(mockedProvider.fallbackProviders[1].provider, 'fetchJson')
        .mockImplementation(fakeFetchImpl);

      mockedFallbackDetectNetwork[0] = jest.spyOn(
        mockedProvider.fallbackProviders[0].provider,
        'detectNetwork',
      );

      mockedFallbackDetectNetwork[1] = jest.spyOn(
        mockedProvider.fallbackProviders[1].provider,
        'detectNetwork',
      );

      mockedProviderDetectNetwork = jest.spyOn(mockedProvider, 'detectNetwork');
    };

    // beforeEach(async () => {});

    afterEach(async () => {
      jest.resetAllMocks();
    });

    test('should do no fallback to next provider if first provider is ok', async () => {
      await createMocks(1, 1);

      expect(mockedProviderDetectNetwork).toBeCalledTimes(0);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(0);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(0);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(0);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(0);

      // first provider should do both fetches only
      await mockedProvider.getBlock(10000);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);

      // first provider should do both fetches only
      await mockedProvider.getBlock(10001);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(3);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(3);
    });

    test('should do fallback to next provider if first provider throws exception after successfull network detection', async () => {
      await createMocks(1, 1);

      let runs = 0;
      const fakeFetchImplThatThrowsOnSecondRun = async (
        connection: string | ConnectionInfo,
        json?: string,
      ): Promise<unknown> => {
        if (runs > 1) {
          throw new Error('foo');
        }
        runs++;
        return fakeFetchImpl(connection, json);
      };

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatThrowsOnSecondRun,
      );

      expect(mockedProviderDetectNetwork).toBeCalledTimes(0);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(0);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(0);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(0);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(0);

      // first provider
      await mockedProvider.getBlock(10000);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);

      await mockedProvider.getBlock(10001);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(3);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(3);
    });
  });
});
