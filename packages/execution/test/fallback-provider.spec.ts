/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  ExecutionModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import { fakeFetchImpl } from './fixtures/fake-json-rpc';
import { LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';
import { range } from './utils';

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
      fallbackProvidersQty = 2,
      jsonRpcMaxBatchSize = 1,
      maxConcurrentRequests = 1,
      maxRetries = 1,
      logRetries = false,
    ) => {
      const module = {
        imports: [
          ExecutionModule.forFeature({
            imports: [LoggerModule.forRoot({})],
            urls: <[string]>(
              range(0, fallbackProvidersQty).map(
                (i) => `'http://localhost:100${i}'`,
              )
            ),
            requestPolicy: {
              jsonRpcMaxBatchSize,
              batchAggregationWaitMs: 10,
              maxConcurrentRequests,
            },
            network: 1,
            maxRetries: maxRetries,
            logRetries: logRetries,
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(SimpleFallbackJsonRpcBatchProvider);

      range(0, fallbackProvidersQty).forEach((i) => {
        mockedFallbackProviderFetch[i] = jest
          .spyOn(mockedProvider.fallbackProviders[i].provider, 'fetchJson')
          .mockImplementation(fakeFetchImpl);

        mockedFallbackDetectNetwork[i] = jest.spyOn(
          mockedProvider.fallbackProviders[i].provider,
          'detectNetwork',
        );
      });

      mockedProviderDetectNetwork = jest.spyOn(mockedProvider, 'detectNetwork');
    };

    // beforeEach(async () => {});

    afterEach(async () => {
      jest.resetAllMocks();
    });

    test('should do no fallback to next provider if first provider is ok', async () => {
      await createMocks(2);

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

    test('should do fallback to next provider if first provider throws exception after successful network detection', async () => {
      await createMocks(2);

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

    test('should do fallback to next provider if first provider always throws exception', async () => {
      await createMocks(2);

      const fakeFetchImplThatAlwaysThrows = async (): Promise<never> => {
        throw new Error('foo');
      };

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatAlwaysThrows,
      );

      // first provider
      await mockedProvider.getBlock(10002);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(4);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);

      await mockedProvider.getBlock(10003);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(6);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(4);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(3);
    });
  });
});
