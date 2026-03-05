/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  FallbackProviderModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import { createUrlDispatchedFetchFn } from './fixtures/fake-json-rpc';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';
import { range, sleep } from './utils';
import { NonEmptyArray } from '../src/interfaces/non-empty-array';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
import { Network } from '@ethersproject/networks';
import { NoNewBlocksWhilePollingError } from '../src/error/no-new-blocks-while-polling.error';

type MockedSimpleFallbackJsonRpcBatchProvider =
  SimpleFallbackJsonRpcBatchProvider & {
    networksEqual(networkA: Network, networkB: Network): boolean;
    fallbackProviders: [
      { provider: ExtendedJsonRpcBatchProvider; valid: boolean },
    ];
  };

describe('Execution module. ', () => {
  describe('SimpleFallbackJsonRpcBatchProvider polling', () => {
    jest.setTimeout(20000);
    let mockedProvider: MockedSimpleFallbackJsonRpcBatchProvider;
    const mockedFallbackProviderFetch: jest.Mock[] = [];

    const createMocks = async (
      fallbackProvidersQty = 2,
      jsonRpcMaxBatchSize = 2,
      maxConcurrentRequests = 2,
      maxRetries = 1,
      logRetries = false,
      urls: NonEmptyArray<string | ConnectionInfo> | null = null,
      fetchMiddlewares?: MiddlewareCallback<Promise<any>>[], // eslint-disable-line @typescript-eslint/no-explicit-any
      resetIntervalMs?: number,
    ) => {
      if (!urls && fallbackProvidersQty < 1) {
        throw new Error('fallbackProvidersQty must be >= 1');
      }

      const resolvedUrls =
        urls ??
        (range(0, fallbackProvidersQty).map(
          (i: number) => `'http://localhost:100${i}'`,
        ) as NonEmptyArray<string>);

      const fetchFn = createUrlDispatchedFetchFn(
        resolvedUrls as string[],
        mockedFallbackProviderFetch,
      );

      const module = {
        imports: [
          FallbackProviderModule.forFeature({
            imports: [LoggerModule.forRoot({ transports: [nullTransport()] })],
            urls: resolvedUrls,
            requestPolicy: {
              jsonRpcMaxBatchSize,
              batchAggregationWaitMs: 10,
              maxConcurrentRequests,
            },
            network: 1,
            maxRetries: maxRetries,
            logRetries: logRetries,
            resetIntervalMs: resetIntervalMs,
            maxTimeWithoutNewBlocksMs: 1000,
            fetchMiddlewares,
            fetchFn,
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(SimpleFallbackJsonRpcBatchProvider);
    };

    afterEach(async () => {
      jest.resetAllMocks();
    });

    test('should emit error when no new blocks while polling', async () => {
      const errors: Error[] = [];
      const listenerMock = jest.fn();
      await createMocks(2);

      mockedProvider.pollingInterval = 100;
      mockedProvider.on('block', listenerMock);

      mockedProvider.on('error', (err) => {
        errors.push(err);
      });

      await sleep(2000);

      const noNewBlocksErrors = errors.filter(
        (err) => err instanceof NoNewBlocksWhilePollingError,
      );

      expect(listenerMock).toBeCalledTimes(1);
      expect(errors.length).toBe(1);
      expect(noNewBlocksErrors.length).toBe(1);

      mockedProvider.removeAllListeners();
    });

    it('should call listener 1 time without errors', async () => {
      const errors: Error[] = [];
      const listener = jest.fn();
      const blockNumber = 12345;

      mockedProvider.on('block', listener);
      mockedProvider.on('error', (err) => errors.push(err));
      expect(listener).not.toHaveBeenCalled();

      // Emit a block event
      mockedProvider.emit('block', blockNumber);
      await sleep(10);

      // Ensure that the listener was called with the correct arguments
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(blockNumber);
      expect(errors.length).toBe(0);

      mockedProvider.removeAllListeners();
    });
  });
});
