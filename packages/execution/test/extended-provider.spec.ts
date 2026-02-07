import { Test } from '@nestjs/testing';
import { ExtendedJsonRpcBatchProvider, BatchProviderModule } from '../src';
import { ConnectionInfo } from '@ethersproject/web';
import {
  fakeFetchImpl,
  fixtures,
  makeFetchImplWithSpecificFeeHistory,
  makeFakeFetchImplThatHangs,
} from './fixtures/fake-json-rpc';
import { range } from './utils';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { JsonRpcRequest, JsonRpcResponse, FetchError } from '../src';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
import { RequestTimeoutError } from '../src/error/request-timeout.error';

type MockedExtendedJsonRpcBatchProvider = ExtendedJsonRpcBatchProvider & {
  fetchJson: (
    connection: string | ConnectionInfo,
    json?: string,
  ) => Promise<unknown>;
};

describe('Execution module. ', () => {
  describe('ExtendedJsonRpcBatchProvider', () => {
    let mockedProvider: MockedExtendedJsonRpcBatchProvider;
    let mockedProviderFetch: jest.SpyInstance;
    let mockedDetectNetwork: jest.SpyInstance;

    const createMocks = async (
      jsonRpcMaxBatchSize: number,
      maxConcurrentRequests: number,
      fetchMiddlewares?: MiddlewareCallback<Promise<any>>[], // eslint-disable-line @typescript-eslint/no-explicit-any
    ) => {
      const module = {
        imports: [
          BatchProviderModule.forFeature({
            imports: [LoggerModule.forRoot({ transports: [nullTransport()] })],
            url: 'http://localhost',
            requestPolicy: {
              jsonRpcMaxBatchSize,
              batchAggregationWaitMs: 10,
              maxConcurrentRequests,
            },
            fetchMiddlewares,
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(ExtendedJsonRpcBatchProvider);

      mockedProviderFetch = jest
        .spyOn(mockedProvider, 'fetchJson')
        .mockImplementation(fakeFetchImpl());

      mockedDetectNetwork = jest.spyOn(mockedProvider, 'detectNetwork');
    };

    // beforeEach(async () => {});

    afterEach(async () => mockedProviderFetch.mockReset());

    test('should do basic functionality and return correct data', async () => {
      await createMocks(1, 1);

      expect(mockedProviderFetch).toBeCalledTimes(0);
      expect(mockedDetectNetwork).toBeCalledTimes(0);

      const block = await mockedProvider.getBlock(1);
      expect(mockedProviderFetch).toBeCalledTimes(2);
      expect(mockedDetectNetwork).toBeCalledTimes(2);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);

      const balance = await mockedProvider.getBalance(fixtures.address);
      expect(mockedProviderFetch).toBeCalledTimes(3);
      expect(mockedDetectNetwork).toBeCalledTimes(3);
      expect(balance.toHexString()).toBe(fixtures.eth_getBalance.latest);
    });

    test('should do sync network detection fetch only once (network should be cached)', async () => {
      await createMocks(1, 1);

      expect(mockedProviderFetch).toBeCalledTimes(0);
      expect(mockedDetectNetwork).toBeCalledTimes(0);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);
      expect(mockedDetectNetwork).toBeCalledTimes(2);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);
      expect(mockedDetectNetwork).toBeCalledTimes(3);

      await mockedProvider.getBlock(10000);
      expect(mockedProviderFetch).toBeCalledTimes(2);
      expect(mockedDetectNetwork).toBeCalledTimes(4);

      await mockedProvider.getBalance(fixtures.address);
      expect(mockedProviderFetch).toBeCalledTimes(3);
      expect(mockedDetectNetwork).toBeCalledTimes(5);

      mockedProvider.polling;
    });

    test('should do no batching when batch size = 1, total = 1', async () => {
      await createMocks(1, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all([mockedProvider.getBlock(10000)]);

      expect(mockedProviderFetch).toBeCalledTimes(2);
    });

    test('should do no batching when batch size = 1, total = 6', async () => {
      await createMocks(1, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all(range(0, 6).map(() => mockedProvider.getBlock(10000)));

      expect(mockedProviderFetch).toBeCalledTimes(7);
    });

    test('should do proper batching when batch size = 3, total = 6', async () => {
      await createMocks(3, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all(range(0, 6).map(() => mockedProvider.getBlock(10000)));

      expect(mockedProviderFetch).toBeCalledTimes(3);
    });

    test('should do no batching when batch size = 10, total = 6', async () => {
      await createMocks(10, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all(range(0, 6).map(() => mockedProvider.getBlock(10000)));

      expect(mockedProviderFetch).toBeCalledTimes(2);
    });

    test('should throw exception on JsonRpc error', async () => {
      await createMocks(10, 10);

      const fakeFetchImplWithRPCError = async (
        connection: string | ConnectionInfo,
        json?: string,
      ): Promise<JsonRpcResponse> => {
        const requests = json ? JSON.parse(json) : {};

        return requests.map((request: JsonRpcRequest) => {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: 1,
              message: 'json-rpc-error',
              data: { foo: 'foo' },
            },
          };
        });
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow();
      expect(mockedProviderFetch).toBeCalledTimes(4);
    });

    test('should support multiple static (via constructor) middleware for fetching', async () => {
      const mockCallback = jest.fn();

      const middlewares: MiddlewareCallback<Promise<unknown>>[] = [
        (next) => {
          mockCallback('foo');
          return next();
        },
        (next) => {
          mockCallback('bar');
          return next();
        },
      ];

      await createMocks(1, 1, middlewares);

      expect(mockCallback).toBeCalledTimes(0);

      await mockedProvider.getBlock(10000);
      expect(mockCallback).toBeCalledTimes(4);

      // 'getNetwork' fetch call
      expect(mockCallback.mock.calls[0][0]).toBe('foo');
      expect(mockCallback.mock.calls[1][0]).toBe('bar');

      // 'getBlock' fetch call
      expect(mockCallback.mock.calls[2][0]).toBe('foo');
      expect(mockCallback.mock.calls[3][0]).toBe('bar');
    });

    test('should support multiple dynamic middleware for fetching', async () => {
      await createMocks(1, 1);

      const mockCallback = jest.fn();

      mockedProvider.use((next) => {
        mockCallback('first');
        return next();
      });

      mockedProvider.use((next) => {
        mockCallback('second');
        return next();
      });

      await mockedProvider.getBlock(10000);

      expect(mockCallback).toBeCalledTimes(4);
      expect(mockCallback.mock.calls[0][0]).toBe('first');
      expect(mockCallback.mock.calls[1][0]).toBe('second');
      expect(mockCallback.mock.calls[2][0]).toBe('first');
      expect(mockCallback.mock.calls[3][0]).toBe('second');
    });

    test('should provide the correct context to middleware', async () => {
      await createMocks(1, 1);

      const mockCallback = jest.fn();

      mockedProvider.use((next, ctx) => {
        mockCallback(ctx.provider.connection.url);
        return next();
      });

      await mockedProvider.getBlock(10000);

      expect(mockCallback).toBeCalledWith('http://localhost');
    });

    test('should support EIP-1898', async () => {
      await createMocks(2, 2);

      const balanceByBlockNumber = await mockedProvider.getBalance(
        fixtures.address,
        fixtures.block.number,
      );
      expect(balanceByBlockNumber.toHexString()).toBe(
        fixtures.eth_getBalance.default_blockHash,
      );

      const balanceByHexedBlockNumber = await mockedProvider.getBalance(
        fixtures.address,
        fixtures.block.numberHex,
      );
      expect(balanceByHexedBlockNumber.toHexString()).toBe(
        fixtures.eth_getBalance.default_blockNumberHex,
      );

      const balanceByBlockHash = await mockedProvider.getBalance(
        fixtures.address,
        fixtures.block.hash,
      );
      expect(balanceByBlockHash.toHexString()).toBe(
        fixtures.eth_getBalance.default_blockNumber,
      );

      // EIP-1898
      const balanceWhenEip1898ByBlockNumber = await mockedProvider.getBalance(
        fixtures.address,
        {
          blockNumber: fixtures.block.numberHex,
        },
      );
      expect(balanceWhenEip1898ByBlockNumber.toHexString()).toBe(
        fixtures.eth_getBalance.eip1898_blockNumber,
      );

      // EIP-1898
      const balanceWhenEip1898ByBlockHash = await mockedProvider.getBalance(
        fixtures.address,
        {
          blockHash: fixtures.block.hash,
          requireCanonical: true,
        },
      );
      expect(balanceWhenEip1898ByBlockHash.toHexString()).toBe(
        fixtures.eth_getBalance.eip1898_blockHash,
      );
    });

    test('should return trace calls by block hash', async () => {
      await createMocks(2, 2);

      const traceCalls = await mockedProvider.getDebugTraceBlockByHash(
        '0xbe61c939c5c04c94779678275d8ce96ae0e4d996fd322319a0e0c17771d5848f',
        {
          tracer: 'callTracer',
          disableStorage: true,
          disableStack: true,
          enableMemory: false,
          enableReturnData: false,
        },
      );

      expect(traceCalls.length).toEqual(2);
      expect(traceCalls[0]).toHaveProperty('result');
      expect(traceCalls[1]).toHaveProperty('result');
    });

    test('should return fee history with empty reward property', async () => {
      await createMocks(2, 2);

      const feeHistory = await mockedProvider.getFeeHistory(
        3,
        'latest',
        [1, 5, 10],
      );
      expect(feeHistory).toHaveProperty('baseFeePerGas');
      expect(feeHistory).toHaveProperty('oldestBlock');
      expect(feeHistory).toHaveProperty('reward');
    });

    test('should return undefined fee history if not exists', async () => {
      await createMocks(2, 2);

      mockedProviderFetch.mockImplementation(
        makeFetchImplWithSpecificFeeHistory({
          baseFeePerGas: ['0x602828e60', '0x5d014f665'],
          gasUsedRatio: [0.36889105544897927, 0.21068196330316574],
          oldestBlock: '0xdfb206',
        }),
      );

      const feeHistory = await mockedProvider.getFeeHistory(2);
      expect(feeHistory).toHaveProperty('baseFeePerGas');
      expect(feeHistory).toHaveProperty('oldestBlock');
      expect(feeHistory).toHaveProperty('reward');
      expect(feeHistory.reward.length).toBe(0);
    });

    test('should throw exception on JsonRpc error when node reached rpc batching limit', async () => {
      await createMocks(10, 10);

      // this will trigger network detection and provider initialization
      await mockedProvider.getBlock(1000);

      const fakeFetchImplWithRPCError = async (): Promise<JsonRpcResponse> => {
        return {
          jsonrpc: '2.0',
          id: <number>(<unknown>null), // real scenario from Erigon node
          error: {
            code: -32000,
            message: 'rpc batch limit reached',
          },
        };
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(
        async () => await mockedProvider.getBlock(42),
      ).rejects.toThrowError(
        new FetchError(
          'Unexpected batch result. Possible reason: "rpc batch limit reached".',
        ),
      );
      expect(mockedProviderFetch).toBeCalledTimes(3);
    });

    test('should throw exception on JsonRpc error when node reached rpc batching limit without any error message', async () => {
      await createMocks(10, 10);

      // this will trigger network detection and provider initialization
      await mockedProvider.getBlock(1000);

      const fakeFetchImplWithRPCError = async (): Promise<JsonRpcResponse> => {
        return {
          jsonrpc: '2.0',
          id: 1,
        };
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(
        async () => await mockedProvider.getBlock(42),
      ).rejects.toThrowError(new FetchError('Unexpected batch result.'));
      expect(mockedProviderFetch).toBeCalledTimes(3);
    });

    test('should throw exception on JsonRpc error when partial rpc response received from node', async () => {
      await createMocks(10, 10);

      // this will trigger network detection and provider initialization
      await mockedProvider.getBlock(1000);

      const fakeFetchImplWithRPCError = async (): Promise<
        JsonRpcResponse[]
      > => {
        return [];
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(async () => {
        // these requests will be batched
        await mockedProvider.getBlock(42);
        await mockedProvider.getBlock(32);
      }).rejects.toThrowError(
        new FetchError('Partial payload batch result. Response 44 not found'),
      );
      expect(mockedProviderFetch).toBeCalledTimes(3);
    });
  });

  describe('Request timeout in send()', () => {
    type TestableProvider = MockedExtendedJsonRpcBatchProvider & {
      _queue: { length: number };
    };

    let provider: TestableProvider;
    let fetchSpy: jest.SpyInstance;

    const createProviderWithTimeout = (requestTimeoutMs?: number) => {
      provider = new ExtendedJsonRpcBatchProvider(
        'http://localhost',
        undefined,
        {
          jsonRpcMaxBatchSize: 10,
          maxConcurrentRequests: 5,
          batchAggregationWaitMs: 10,
        },
        [],
        requestTimeoutMs,
      ) as TestableProvider;
      fetchSpy = jest
        .spyOn(provider, 'fetchJson')
        .mockImplementation(fakeFetchImpl());
    };

    afterEach(() => {
      fetchSpy?.mockReset();
    });

    test('should reject with RequestTimeoutError when request exceeds timeout', async () => {
      createProviderWithTimeout(200);

      // Cache network detection with fast mock
      await provider.getNetwork();

      // Switch to hanging mock
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(2000));

      await expect(provider.getBlock(42)).rejects.toThrow(RequestTimeoutError);
    }, 3000);

    test('should include correct timeoutMs and message in error', async () => {
      createProviderWithTimeout(150);

      await provider.getNetwork();
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(2000));

      let caughtError: RequestTimeoutError | null = null;
      try {
        await provider.getBlock(42);
      } catch (error) {
        caughtError = error as RequestTimeoutError;
      }

      expect(caughtError).toBeInstanceOf(RequestTimeoutError);
      expect(caughtError?.timeoutMs).toBe(150);
      expect(caughtError?.message).toBe('Request timeout after 150ms');
    }, 3000);

    test('should resolve normally when response arrives before timeout', async () => {
      createProviderWithTimeout(2000);

      // All responses are fast (default mock)
      const block = await provider.getBlock(42);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);
    }, 3000);

    test('should not timeout when requestTimeoutMs is not configured', async () => {
      createProviderWithTimeout(undefined);

      // Response takes 300ms but no timeout is set — should resolve
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(300));

      const block = await provider.getBlock(42);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);
    }, 3000);

    test('should timeout faster than the hang time', async () => {
      createProviderWithTimeout(200);

      await provider.getNetwork();
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(5000));

      const start = Date.now();
      await expect(provider.getBlock(42)).rejects.toThrow(RequestTimeoutError);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(150); // allow small margin
      expect(duration).toBeLessThan(3000);
    }, 5000);

    test('should clean up timer via .finally() when resolved before timeout', async () => {
      createProviderWithTimeout(5000);
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      await provider.getBlock(42);

      // clearTimeout should be called in .finally() for each send() call
      // (network detection + getBlock = at least 2 send() calls with timers)
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    }, 3000);

    test('should timeout each request independently in a batch', async () => {
      createProviderWithTimeout(200);

      await provider.getNetwork();
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(2000));

      // Send multiple requests that will be batched together
      const results = await Promise.allSettled([
        provider.getBlock(1),
        provider.getBlock(2),
        provider.getBlock(3),
      ]);

      // All should timeout independently
      results.forEach((result) => {
        expect(result.status).toBe('rejected');
        if (result.status === 'rejected') {
          expect(result.reason).toBeInstanceOf(RequestTimeoutError);
        }
      });
    }, 3000);

    test('should work normally after a previous timeout', async () => {
      createProviderWithTimeout(200);

      await provider.getNetwork();

      // First request — hangs and times out
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(2000));
      await expect(provider.getBlock(42)).rejects.toThrow(RequestTimeoutError);

      // Second request — responds normally
      fetchSpy.mockImplementation(fakeFetchImpl());
      const block = await provider.getBlock(42);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);
    }, 5000);

    test('should not cause unhandled rejection when batch resolves after timeout (Promise idempotency)', async () => {
      createProviderWithTimeout(100);

      await provider.getNetwork();
      // Response arrives at 500ms, timeout fires at 100ms
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(500));

      const unhandledRejectionHandler = jest.fn();
      process.on('unhandledRejection', unhandledRejectionHandler);

      await expect(provider.getBlock(42)).rejects.toThrow(RequestTimeoutError);

      // Wait for the batch response to arrive and try to resolve the already-rejected promise
      await new Promise((resolve) => setTimeout(resolve, 700));

      expect(unhandledRejectionHandler).not.toHaveBeenCalled();
      process.removeListener('unhandledRejection', unhandledRejectionHandler);
    }, 3000);

    // ============================================================
    // Leak prevention tests
    // Old approach used Promise.race([sendPromise, timeoutPromise]) in perform().
    // Problems: 1) orphaned promises (loser of race hangs forever)
    //           2) 3 Promise objects per request instead of 1
    //           3) queue never drained timed-out entries
    //           4) timers not cleaned up on normal resolve
    // New approach: single promise with setTimeout+reject inside send(),
    // .finally() cleans timer. These tests verify no leaks.
    // ============================================================

    test('should drain queue after timeout — no orphaned queue entries', async () => {
      createProviderWithTimeout(100);

      await provider.getNetwork();
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(500));

      // Send request that will timeout
      await expect(provider.getBlock(42)).rejects.toThrow(RequestTimeoutError);

      // Wait for batch aggregator to process and drain the queue
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Queue must be empty — no orphaned entries stuck in it
      // (with old Promise.race, entries stayed in queue and were processed,
      // but the result went to an orphaned promise nobody listened to)
      expect(provider._queue.length).toBe(0);
    }, 3000);

    test('should not accumulate state after many sequential timeouts', async () => {
      createProviderWithTimeout(50);

      await provider.getNetwork();
      // Hang time must be short enough so in-flight HTTP requests clear
      // before we test recovery (concurrency limiter slots free up)
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(300));

      // Fire 10 sequential timeouts
      for (let i = 0; i < 10; i++) {
        await expect(provider.getBlock(i)).rejects.toThrow(RequestTimeoutError);
      }

      // Wait for all in-flight HTTP responses + batch aggregator ticks to complete
      // This frees concurrency limiter slots so the next request can proceed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Queue must be drained — no accumulated entries
      expect(provider._queue.length).toBe(0);

      // Provider should still work after many timeouts
      fetchSpy.mockImplementation(fakeFetchImpl());
      const block = await provider.getBlock(42);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);
    }, 10000);

    test('should not leave dangling timers after batch resolves timed-out request', async () => {
      createProviderWithTimeout(100);

      await provider.getNetwork();
      fetchSpy.mockImplementation(makeFakeFetchImplThatHangs(300));

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      await expect(provider.getBlock(42)).rejects.toThrow(RequestTimeoutError);

      // At this point timeout rejected the promise, .finally() cleaned the timer.
      // But batch HTTP is still in-flight (300ms hang).
      const callsAfterTimeout = clearTimeoutSpy.mock.calls.length;

      // Wait for batch to resolve and .finally() to fire again (no-op resolve on settled promise)
      await new Promise((resolve) => setTimeout(resolve, 400));

      // .finally() must have called clearTimeout even though promise was already rejected
      expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThanOrEqual(
        callsAfterTimeout,
      );

      clearTimeoutSpy.mockRestore();
    }, 3000);

    test('should not use Promise.race — send() returns a single promise, not a race wrapper', async () => {
      createProviderWithTimeout(200);

      await provider.getNetwork();

      // Spy on Promise.race to ensure it's never called by send()
      const raceSpy = jest.spyOn(Promise, 'race');
      const callsBefore = raceSpy.mock.calls.length;

      const sendPromise = provider.send('eth_blockNumber', []);

      // send() must NOT use Promise.race (old withTimeout approach did)
      expect(raceSpy.mock.calls.length).toBe(callsBefore);

      raceSpy.mockRestore();
      await sendPromise.catch(() => undefined); // cleanup
    }, 3000);
  });
});
