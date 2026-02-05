/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  FallbackProviderModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import {
  fakeFetchImpl,
  fakeFetchImplThatAlwaysFails,
  fakeFetchImplThatCanOnlyDoNetworkDetection,
  fixtures,
  makeFakeFetchImplReturnsNull,
  makeFakeFetchImplThatFailsAfterNRequests,
  makeFakeFetchImplThatFailsFirstNRequests,
  makeFakeFetchImplThrowsError,
  makeFetchImplWithSpecificFeeHistory,
  makeFetchImplWithSpecificNetwork,
  makeFakeFetchImplThatHangs,
} from './fixtures/fake-json-rpc';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';
import { range, sleep } from './utils';
import { NonEmptyArray } from '../src/interfaces/non-empty-array';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
import { Network } from '@ethersproject/networks';
import { nonRetryableErrors } from '../src/common/errors';
import { ErrorCode, Logger } from '@ethersproject/logger';
import {
  AllProvidersFailedError,
  FallbackProviderEvents,
  RequestTimeoutError,
} from '../src';

export type MockedExtendedJsonRpcBatchProvider =
  ExtendedJsonRpcBatchProvider & {
    fetchJson: (
      connection: string | ConnectionInfo,
      json?: string,
    ) => Promise<unknown>;
  };

type MockedSimpleFallbackJsonRpcBatchProvider =
  SimpleFallbackJsonRpcBatchProvider & {
    networksEqual(networkA: Network, networkB: Network): boolean;
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
      jsonRpcMaxBatchSize = 2,
      maxConcurrentRequests = 2,
      maxRetries = 1,
      logRetries = false,
      urls: NonEmptyArray<string | ConnectionInfo> | null = null,
      fetchMiddlewares?: MiddlewareCallback<Promise<any>>[], // eslint-disable-line @typescript-eslint/no-explicit-any
      resetIntervalMs?: number,
      requestTimeoutMs?: number,
      instanceLabel?: string,
    ) => {
      const module = {
        imports: [
          FallbackProviderModule.forFeature({
            imports: [LoggerModule.forRoot({ transports: [nullTransport()] })],
            urls:
              urls ??
              <[string]>(
                range(0, fallbackProvidersQty).map(
                  (i: number) => `'http://localhost:100${i}'`,
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
            resetIntervalMs: resetIntervalMs,
            requestTimeoutMs: requestTimeoutMs,
            fetchMiddlewares,
            instanceLabel,
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(SimpleFallbackJsonRpcBatchProvider);

      range(0, fallbackProvidersQty).forEach((i) => {
        if (mockedProvider.fallbackProviders[i]) {
          mockedFallbackProviderFetch[i] = jest
            .spyOn(mockedProvider.fallbackProviders[i].provider, 'fetchJson')
            .mockImplementation(fakeFetchImpl());

          mockedFallbackDetectNetwork[i] = jest.spyOn(
            mockedProvider.fallbackProviders[i].provider,
            'detectNetwork',
          );
        }
      });

      mockedProviderDetectNetwork = jest.spyOn(mockedProvider, 'detectNetwork');
    };

    afterEach(async () => {
      // Wait for pending setTimeout from ethers.js constructor to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
      jest.resetAllMocks();
    });

    test('should do basic functionality and return correct data with 1 fallback provider', async () => {
      await createMocks(1);

      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(0);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(0);

      const block = await mockedProvider.getBlock(42);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);

      // 2 calls here because first 'getBlock' call
      // will initiate 'detectNetwork' fetch and 'getBlock' fetch
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);

      const balance = await mockedProvider.getBalance(
        fixtures.address,
        'latest',
      );
      expect(mockedProviderDetectNetwork).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);
      expect(balance.toHexString()).toBe(fixtures.eth_getBalance.latest);
    });

    test('should do basic functionality and return correct data with 2 fallback providers', async () => {
      await createMocks(2);

      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(0);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(0);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(0);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(0);

      const block = await mockedProvider.getBlock(42);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);
    });

    test('should not do a fallback to the next provider if first provider is ok (2 fallback providers)', async () => {
      await createMocks(2);

      // first provider should do both fetches only
      await mockedProvider.getBlock(10000);
      expect(mockedProvider.activeProviderIndex).toBe(0);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);

      // first provider should do both fetches only
      await mockedProvider.getBlock(10001);
      expect(mockedProvider.activeProviderIndex).toBe(0);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(3);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(3);
    });

    test('should not retry on non-retryable errors and not switch to another provider', async () => {
      await createMocks(2);

      // will trigger network detection
      await mockedProvider.getBlock(10000);

      // network detection + getBlock
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);

      // network detection only
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);

      const makeError = (errorCode: number | string) => {
        const err = new Error(`ErrorCode${errorCode}`);
        (<Error & { code: number | string }>err).code = errorCode;
        return err;
      };

      for (let i = 0; i < nonRetryableErrors.length; i++) {
        mockedFallbackProviderFetch[0].mockReset();
        mockedFallbackProviderFetch[1].mockClear();

        mockedFallbackProviderFetch[0].mockImplementation(
          makeFakeFetchImplThrowsError(makeError(nonRetryableErrors[i])),
        );

        await expect(
          async () => await mockedProvider.getBlock(42),
        ).rejects.toThrow(`ErrorCode${nonRetryableErrors[i]}`);

        expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(1);
        expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(0);
      }
    });

    test('should do fallback to second provider if first provider is unavailable, but after 2 seconds do a reset (switch) to the first provider', async () => {
      jest.setTimeout(5000);

      await createMocks(2, 1, 1, 1, false, null, undefined, 2000);

      // first provider always fails
      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatAlwaysFails,
      );

      mockedFallbackProviderFetch[1].mockImplementation(
        fakeFetchImpl(1, 10068),
      );

      // will do a fallback from 1st provider to 2nd provider
      expect(mockedProvider.activeProviderIndex).toBe(0);
      const blockA = await mockedProvider.getBlock('latest');
      expect(mockedProvider.activeProviderIndex).toBe(1);
      expect(blockA.number).toBe(10068);

      // mocking first provider to return certain block data
      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImpl(1, 10032),
      );

      await sleep(2500); // will do a reset

      // data from first provider
      expect(mockedProvider.activeProviderIndex).toBe(0);
      const blockB = await mockedProvider.getBlock('latest');
      expect(mockedProvider.activeProviderIndex).toBe(0);
      expect(blockB.number).toBe(10032);
    });

    test('should throw exception when only 1 fallback provider supplied and it can only do network detection', async () => {
      await createMocks(1, 1, 1, 1);

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatCanOnlyDoNetworkDetection,
      );

      // first provider should do network detection and then 'getBlock'
      await expect(
        async () => await mockedProvider.getBlock(10000),
      ).rejects.toThrow(/All attempts to do ETH1 RPC request failed/);

      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
    });

    test(
      'should do fallback to next provider if first provider throws ' +
        'exception after successful network detection (2 fallback providers)',
      async () => {
        await createMocks(2);

        mockedFallbackProviderFetch[0].mockImplementation(
          fakeFetchImplThatCanOnlyDoNetworkDetection,
        );

        // first provider attempt
        await mockedProvider.getBlock(10000);
        expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
        expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
        expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(2);
        expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
        expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);

        // second provider
        await mockedProvider.getBlock(10001);
        expect(mockedProviderDetectNetwork).toBeCalledTimes(2);
        expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
        expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(3);
        expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);
        expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(3);
      },
    );

    test('should do fallback to next provider if first provider always throws exception', async () => {
      await createMocks(2);

      const fakeFetchImplThatAlwaysThrows = async (): Promise<never> => {
        throw new Error('foo');
      };

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatAlwaysThrows,
      );

      // first provider
      const blockA = await mockedProvider.getBlock('latest');
      expect(blockA.number).toBe(10000);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(4);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);

      const blockB = await mockedProvider.getBlock('latest');
      expect(blockB.number).toBe(10000);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(2);

      // the same, because first provider marked as 'unreachable'
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(4);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(3);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(3);

      // the same, because first provider marked as 'unreachable'
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(3);
    });

    test('should filter out empty or bad urls in configuration and work properly', async () => {
      const urls: NonEmptyArray<string | ConnectionInfo> = [
        '',
        { url: '' },
        'http://localhost:8545',
      ];
      await createMocks(2, 1, 1, 2, false, urls);

      expect(<any>mockedProvider.fallbackProviders.length).toBe(1);

      await mockedProvider.getBlock(10003);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
    });

    test('should fail when there are no valid urls in configuration', async () => {
      const urls: NonEmptyArray<string | ConnectionInfo> = [
        '',
        { url: '' },
        <ConnectionInfo>{},
        <string>(<unknown>undefined),
        <string>(<unknown>null),
      ];

      await expect(
        async () => await createMocks(4, 1, 1, 2, false, urls),
      ).rejects.toThrow('No valid URLs or Connections were provided');
    });

    test('should go full cycle when doing fallback with correct networks', async () => {
      await createMocks(2, 1, 1, 1);

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplThatFailsFirstNRequests(3, 1, 10001),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFakeFetchImplThatFailsAfterNRequests(2, 1, 10002),
      );

      // fallback from 1st provider to 2nd provider
      const blockA = await mockedProvider.getBlock('latest');
      expect(blockA.number).toBe(10002);

      // fallback from 2nd provider to 1st provider
      const blockB = await mockedProvider.getBlock('latest');
      expect(blockB.number).toBe(10001);
    });

    test('should fail when there are no providers that are reachable', async () => {
      await createMocks(2);

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatAlwaysFails,
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        fakeFetchImplThatAlwaysFails,
      );

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow(
        'All fallback endpoints are unreachable or all fallback networks differ between each other',
      );
    });

    test('should fail and return error cause when there are no providers that are reachable', async () => {
      await createMocks(2);

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatAlwaysFails,
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        fakeFetchImplThatAlwaysFails,
      );

      let error: AllProvidersFailedError | null = null;
      try {
        await mockedProvider.getBlock(1000);
      } catch (e) {
        error = <AllProvidersFailedError>e;
      }

      expect(error?.message).toBe(
        'All fallback endpoints are unreachable or all fallback networks differ between each other',
      );
      expect(error).toBeInstanceOf(AllProvidersFailedError);
      expect(error?.originalError).toBeInstanceOf(Error);
      expect(error?.cause).toBeInstanceOf(Error);
    });

    test('should fail when some fallback endpoints have different networks chainId', async () => {
      await createMocks(2);

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFetchImplWithSpecificNetwork(2),
      );

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow(
        'Fallback provider [1] network chainId [2] is different to network chainId from config [1]',
      );
    });

    test('should fail when some fallback endpoints have different networks ENS or Name at startup', async () => {
      await createMocks(2);

      const mockedNetworksEqual = jest
        .spyOn(mockedProvider, 'networksEqual')
        .mockImplementation((): boolean => {
          return false;
        });

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );

      await expect(
        async () => await mockedProvider.getBlock('latest'),
      ).rejects.toThrow(
        "Fallback provider [1] network is different to other provider's networks",
      );

      mockedNetworksEqual.mockReset();
    });

    test('should not fail on malformed response from RPC', async () => {
      await createMocks(2);

      const mockedNetworksEqual = jest
        .spyOn(mockedProvider, 'networksEqual')
        .mockImplementation((): boolean => {
          return true;
        });

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplReturnsNull(),
      );

      mockedFallbackProviderFetch[1].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );

      const block = await mockedProvider.getBlock('latest');
      expect(block.number).toBe(10000);

      mockedNetworksEqual.mockReset();
    });

    test('should work when one fallback endpoint is unreachable at startup, but have different network ENS or Name after being reachable again', async () => {
      jest.setTimeout(5000);
      await createMocks(2, 1, 1, 1, false, null, undefined, 2000);

      const mockedNetworksEqual = jest
        .spyOn(mockedProvider, 'networksEqual')
        .mockImplementation((): boolean => {
          return false;
        });

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplThatFailsFirstNRequests(0, 1, 10011),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFakeFetchImplThatFailsFirstNRequests(3, 1, 10042),
      );

      const blockA = await mockedProvider.getBlock('latest');
      expect(blockA.number).toBe(10011);

      await sleep(2500); // will do a reset to first provider (due to resetIntervalMs)

      const blockB = await mockedProvider.getBlock('latest');
      expect(blockB.number).toBe(10011);

      mockedNetworksEqual.mockReset();
    });

    test('should fail when all fallback endpoints have networks not equal to predefined network from config', async () => {
      // mocked module is created with network chainId = 1
      await createMocks(2);

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFetchImplWithSpecificNetwork(2),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFetchImplWithSpecificNetwork(3),
      );

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow(
        'Fallback provider [0] network chainId [2] is different to network chainId from config [1]',
      );
    });

    test(
      'should not fail when one or more fallback endpoints are unreachable at startup, ' +
        'but appears to be reachable after startup with network(s), different to predefined network',
      async () => {
        jest.setTimeout(5000);
        await createMocks(2, 1, 1, 1, false, null, undefined, 2000);

        mockedFallbackProviderFetch[0].mockImplementation(
          makeFakeFetchImplThatFailsFirstNRequests(3, 2, 10000),
        );
        mockedFallbackProviderFetch[1].mockImplementation(
          makeFakeFetchImplThatFailsAfterNRequests(4, 1, 10042),
        );

        // fallback from 1st provider to 2nd provider
        const blockA = await mockedProvider.getBlock('latest');
        expect(blockA.number).toBe(10042);

        await sleep(2500); // will do a reset to first provider (due to resetIntervalMs)

        // fallback from 2nd provider to 1st provider
        const blockB = await mockedProvider.getBlock('latest');
        expect(blockB.number).toBe(10042);
      },
    );

    test('should fail when only one network is different', async () => {
      await createMocks(4);

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );
      mockedFallbackProviderFetch[2].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );
      mockedFallbackProviderFetch[3].mockImplementation(
        makeFetchImplWithSpecificNetwork(2),
      );

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow(
        'Fallback provider [3] network chainId [2] is different to network chainId from config [1]',
      );
    });

    test('should return traceCalls', async () => {
      await createMocks(2);

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

    test('should return fee history if exists', async () => {
      await createMocks(2);

      const feeHistory = await mockedProvider.getFeeHistory(
        3,
        'latest',
        [1, 5, 10],
      );
      expect(feeHistory).toHaveProperty('baseFeePerGas');
      expect(feeHistory).toHaveProperty('oldestBlock');
      expect(feeHistory).toHaveProperty('reward');
    });

    test('should throw error when calling fee history with incorrect blockCount', async () => {
      await createMocks(2);

      await expect(
        async () => await mockedProvider.getFeeHistory(0),
      ).rejects.toThrow(
        'Invalid blockCount for `getFeeHistory`. Should be between 1 and 1024. (argument="blockCount", value=0, code=INVALID_ARGUMENT, version=packages/execution)',
      );

      await expect(
        async () => await mockedProvider.getFeeHistory(1025),
      ).rejects.toThrow(
        'Invalid blockCount for `getFeeHistory`. Should be between 1 and 1024. (argument="blockCount", value=1025, code=INVALID_ARGUMENT, version=packages/execution)',
      );
    });

    test('should return fee history with empty reward property', async () => {
      await createMocks(1);

      mockedFallbackProviderFetch[0].mockImplementation(
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

    test('should support middleware for fetching', async () => {
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

      await createMocks(1, 1, 1, 1, false, undefined, middlewares);

      expect(mockCallback).toBeCalledTimes(0);

      await mockedProvider.getBlock('latest');
      expect(mockCallback).toBeCalledTimes(8); // TODO

      // 'getNetwork' fetch call
      expect(mockCallback.mock.calls[0][0]).toBe('foo');
      expect(mockCallback.mock.calls[1][0]).toBe('bar');

      // 'getBlock' fetch call
      expect(mockCallback.mock.calls[2][0]).toBe('foo');
      expect(mockCallback.mock.calls[3][0]).toBe('bar');
    });

    test('should support EIP-1898', async () => {
      await createMocks(2);

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

    test('should not fail on CALL_EXCEPTION server error and switch to another provider', async () => {
      await createMocks(2);

      // will trigger network detection
      await mockedProvider.getBlock(10000);

      // network detection + getBlock
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);

      // network detection only
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);

      const makeError = () => {
        const etherslogger = new Logger('0.0.0');

        // making some ETIMEDOUT server error
        const serverError = etherslogger.makeError(
          'missing response',
          Logger.errors.SERVER_ERROR,
          {
            requestBody: {
              method: 'eth_call',
              params: [
                {
                  blockHash:
                    '0xafcede9d00617b7befdea44c0ad4d9f6a6f82909f12f796c8233ed290a5c6d91',
                },
              ],
              id: 204601,
              jsonrpc: '2.0',
            },
            requestMethod: 'POST',
            serverError: {
              errno: -60,
              code: 'ETIMEDOUT',
              syscall: 'connect',
              address: '127.0.0.1',
              port: 80,
            },
            url: 'http://some-rpc-provider',
          },
        );

        const callException = etherslogger.makeError(
          'call exception error',
          ErrorCode.CALL_EXCEPTION,
          { error: serverError },
        );

        return callException;
      };

      mockedFallbackProviderFetch[0].mockReset();
      mockedFallbackProviderFetch[0].mockClear();
      mockedFallbackProviderFetch[1].mockClear();

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplThrowsError(makeError()),
      );

      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(0);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(0);

      // first provider will fail and 'getBlock' fetch call will be switched to second provider
      await mockedProvider.getBlock(42);

      // 'getBlock' fetch call to first provider that fails
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(1);

      // 'getBlock' fetch call to second provider that does not fail
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);

      // to ensure the second provider is active
      await mockedProvider.getBlock(10000);

      // no second 'getBlock' fetch
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(1);

      // second 'getBlock' fetch call to second provider that does not fail
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(2);
    });

    test('should emit `fallback-provider:request` events', async () => {
      await createMocks(2);

      let retryAttempt = NaN;
      mockedProvider.eventEmitter.on('rpc', (event: FallbackProviderEvents) => {
        if (event.action === 'fallback-provider:request') {
          retryAttempt = event.retryAttempt;
        }
      });

      const block = await mockedProvider.getBlock(42);

      expect(retryAttempt).toBe(0);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);
    });

    test('should have no rpc listeners by default, but add them when subscribing via eventEmitter', async () => {
      await createMocks(2);

      // Check that child providers have no listeners by default
      const childProviders = mockedProvider.fallbackProviders;
      for (const { provider } of childProviders) {
        expect(provider.eventEmitter.listenerCount('rpc')).toBe(0);
      }

      // Subscribe to parent eventEmitter - this should lazily attach child listeners
      const listener = jest.fn();
      mockedProvider.eventEmitter.on('rpc', listener);

      // Now child providers should have listeners
      for (const { provider } of childProviders) {
        expect(provider.eventEmitter.listenerCount('rpc')).toBe(1);
      }

      // Parent should also have listener
      expect(mockedProvider.eventEmitter.listenerCount('rpc')).toBe(1);
    });

    test('should only attach child listeners once even with multiple subscriptions', async () => {
      await createMocks(2);

      const childProviders = mockedProvider.fallbackProviders;

      // Subscribe multiple times
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      mockedProvider.eventEmitter.on('rpc', listener1);
      mockedProvider.eventEmitter.on('rpc', listener2);
      mockedProvider.eventEmitter.on('rpc', listener3);

      // Child providers should still have only 1 listener each (not 3)
      for (const { provider } of childProviders) {
        expect(provider.eventEmitter.listenerCount('rpc')).toBe(1);
      }

      // Parent should have 3 listeners
      expect(mockedProvider.eventEmitter.listenerCount('rpc')).toBe(3);
    });

    test('should not attach child listeners for non-rpc events', async () => {
      await createMocks(2);

      const childProviders = mockedProvider.fallbackProviders;

      // Subscribe to a different event (not 'rpc')
      mockedProvider.eventEmitter.on('someOtherEvent' as any, jest.fn());

      // Child providers should still have no rpc listeners
      for (const { provider } of childProviders) {
        expect(provider.eventEmitter.listenerCount('rpc')).toBe(0);
      }
    });

    test('should not call emit when no listeners attached (avoid creating event objects)', async () => {
      await createMocks(1);

      // Spy on emit to verify it's not called when no listeners
      const emitSpy = jest.spyOn(mockedProvider.eventEmitter, 'emit');

      // Make request without any listeners
      await mockedProvider.getBlock(42);

      // emit should NOT have been called with 'rpc' event
      const rpcEmitCalls = emitSpy.mock.calls.filter(
        (call) => call[0] === 'rpc',
      );
      expect(rpcEmitCalls.length).toBe(0);

      emitSpy.mockRestore();
    });

    test('should call emit when listeners are attached', async () => {
      await createMocks(1);

      // Attach a listener first
      const listener = jest.fn();
      mockedProvider.eventEmitter.on('rpc', listener);

      // Spy on emit
      const emitSpy = jest.spyOn(mockedProvider.eventEmitter, 'emit');

      // Make request with listener attached
      await mockedProvider.getBlock(42);

      // emit SHOULD have been called with 'rpc' event
      const rpcEmitCalls = emitSpy.mock.calls.filter(
        (call) => call[0] === 'rpc',
      );
      expect(rpcEmitCalls.length).toBeGreaterThan(0);

      // Listener should have been called
      expect(listener).toHaveBeenCalled();

      emitSpy.mockRestore();
    });

    test('should not create event objects in child providers when no listeners', async () => {
      await createMocks(1);

      const childProvider = mockedProvider.fallbackProviders[0].provider;

      // Spy on child provider emit
      const childEmitSpy = jest.spyOn(childProvider.eventEmitter, 'emit');

      // Make request without listeners
      await mockedProvider.getBlock(42);

      // Child provider emit should NOT have been called with 'rpc'
      const rpcEmitCalls = childEmitSpy.mock.calls.filter(
        (call) => call[0] === 'rpc',
      );
      expect(rpcEmitCalls.length).toBe(0);

      childEmitSpy.mockRestore();
    });

    test('should create and propagate events from child providers when listeners attached', async () => {
      await createMocks(1);

      const childProvider = mockedProvider.fallbackProviders[0].provider;

      // Attach listener to parent (triggers lazy subscription)
      const events: FallbackProviderEvents[] = [];
      mockedProvider.eventEmitter.on('rpc', (event) => events.push(event));

      // Spy on child provider emit
      const childEmitSpy = jest.spyOn(childProvider.eventEmitter, 'emit');

      // Make request
      await mockedProvider.getBlock(42);

      // Child provider emit SHOULD have been called with 'rpc'
      const rpcEmitCalls = childEmitSpy.mock.calls.filter(
        (call) => call[0] === 'rpc',
      );
      expect(rpcEmitCalls.length).toBeGreaterThan(0);

      // Events should have propagated to parent listener
      const childEvents = events.filter(
        (e) =>
          e.action === 'provider:request-batched' ||
          e.action === 'provider:response-batched',
      );
      expect(childEvents.length).toBeGreaterThan(0);

      childEmitSpy.mockRestore();
    });

    test('should not emit rpc events when no listeners attached', async () => {
      await createMocks(1);

      const childProvider = mockedProvider.fallbackProviders[0].provider;

      // Verify no listeners before request
      expect(childProvider.eventEmitter.listenerCount('rpc')).toBe(0);

      // Make a request without listeners - should work fine
      const block = await mockedProvider.getBlock(42);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);

      // Still no listeners after request (lazy subscription not triggered)
      expect(childProvider.eventEmitter.listenerCount('rpc')).toBe(0);
    });

    test('should emit rpc events when listeners are attached', async () => {
      await createMocks(2);

      const events: FallbackProviderEvents[] = [];
      mockedProvider.eventEmitter.on('rpc', (event: FallbackProviderEvents) => {
        events.push(event);
      });

      // Make a request - should emit events
      const block = await mockedProvider.getBlock(42);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);

      // Should have received events
      expect(events.length).toBeGreaterThan(0);

      // Should have provider:request-batched and provider:response-batched events
      const actions = events.map((e) => e.action);
      expect(actions).toContain('provider:request-batched');
      expect(actions).toContain('provider:response-batched');
      expect(actions).toContain('fallback-provider:request');
    });

    test('should timeout after requestTimeoutMs with single provider', async () => {
      // Provider hangs for 2 seconds, but timeout is 500ms
      await createMocks(
        1,
        1,
        1,
        1, // maxRetries = 1 (no retry)
        false,
        null,
        undefined,
        undefined,
        500, // requestTimeoutMs: 500ms
      );

      // Provider hangs for 2 seconds (longer than timeout)
      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplThatHangs(2000),
      );

      const startTime = Date.now();

      await expect(
        async () => await mockedProvider.getBlock(42),
      ).rejects.toThrow(/All attempts to do ETH1 RPC request failed/);

      const duration = Date.now() - startTime;

      // Should fail quickly with timeout (no retries)
      expect(duration).toBeGreaterThan(500); // at least timeout
      expect(duration).toBeLessThan(3000); // but faster than hang time

      // Network detection + 1 getBlock attempt
      expect(mockedFallbackProviderFetch[0]).toHaveBeenCalledTimes(2);
    }, 4000);

    test('should timeout and switch to next provider', async () => {
      await createMocks(
        2,
        1,
        1,
        1, // maxRetries = 1 (no retry)
        false,
        null,
        undefined,
        undefined,
        500, // requestTimeoutMs: 500ms
      );

      let callCount = 0;
      // First provider: succeeds for network detection, then hangs
      mockedFallbackProviderFetch[0].mockImplementation(async (conn, json) => {
        callCount++;
        if (callCount === 1) {
          // First call is network detection - let it succeed
          return fakeFetchImpl()(conn, json);
        }
        // Subsequent calls hang (longer than timeout)
        return makeFakeFetchImplThatHangs(2000)(conn, json);
      });

      // Second provider works normally
      mockedFallbackProviderFetch[1].mockImplementation(fakeFetchImpl());

      expect(mockedProvider.activeProviderIndex).toBe(0);

      const block = await mockedProvider.getBlock(42);

      // Should switch to second provider
      expect(mockedProvider.activeProviderIndex).toBe(1);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);

      // First provider: network detection (1) + getBlock timeout (1)
      expect(mockedFallbackProviderFetch[0]).toHaveBeenCalledTimes(2);

      // Second provider: network detection (1) + successful getBlock (1)
      expect(mockedFallbackProviderFetch[1]).toHaveBeenCalledTimes(2);
    }, 4000);

    test('should fail with AllProvidersFailedError when all providers timeout', async () => {
      await createMocks(
        2,
        1,
        1,
        1, // maxRetries = 1 (no retry)
        false,
        null,
        undefined,
        undefined,
        500, // requestTimeoutMs: 500ms
      );

      let callCount0 = 0;
      let callCount1 = 0;

      // Both providers: succeed for network detection, then hang
      mockedFallbackProviderFetch[0].mockImplementation(async (conn, json) => {
        callCount0++;
        if (callCount0 === 1) {
          return fakeFetchImpl()(conn, json);
        }
        return makeFakeFetchImplThatHangs(2000)(conn, json);
      });

      mockedFallbackProviderFetch[1].mockImplementation(async (conn, json) => {
        callCount1++;
        if (callCount1 === 1) {
          return fakeFetchImpl()(conn, json);
        }
        return makeFakeFetchImplThatHangs(2000)(conn, json);
      });

      let caughtError: AllProvidersFailedError | null = null;

      try {
        await mockedProvider.getBlock(42);
      } catch (e) {
        caughtError = e as AllProvidersFailedError;
      }

      expect(caughtError).toBeInstanceOf(AllProvidersFailedError);
      expect(caughtError?.message).toMatch(
        /All attempts to do ETH1 RPC request failed/,
      );
      expect(caughtError?.cause).toBeInstanceOf(RequestTimeoutError);

      // Both providers: network detection (1) + getBlock timeout (1)
      expect(mockedFallbackProviderFetch[0]).toHaveBeenCalledTimes(2);
      expect(mockedFallbackProviderFetch[1]).toHaveBeenCalledTimes(2);
    }, 4000);

    test('should work without timeout when requestTimeoutMs is not set', async () => {
      await createMocks(
        1,
        1,
        1,
        1,
        false,
        null,
        undefined,
        undefined,
        undefined, // no requestTimeoutMs
      );

      // Provider hangs for 1 second, but there's no timeout
      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplThatHangs(1000),
      );

      const block = await mockedProvider.getBlock(42);

      // Should eventually succeed
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);
      expect(mockedFallbackProviderFetch[0]).toHaveBeenCalledTimes(2);
    }, 5000);

    test('should log with instanceLabel when provided', async () => {
      await createMocks(
        2,
        1,
        1,
        1,
        false,
        null,
        undefined,
        undefined,
        undefined,
        'TEST_INSTANCE', // instanceLabel
      );

      // Spy on logger methods (not mock implementation, just spy)
      const logSpy = jest.spyOn(mockedProvider['logger'], 'log');
      const errorSpy = jest.spyOn(mockedProvider['logger'], 'error');

      // Test formatLog method directly to ensure it adds instanceLabel
      const formatted = mockedProvider['formatLog']('test message', 0);
      expect(formatted).toContain('[TEST_INSTANCE]');
      expect(formatted).toContain('[provider:0]');
      expect(formatted).toContain('test message');

      // Test with successful request - should log with instance label
      await mockedProvider.getBlock(42);

      const logCalls = logSpy.mock.calls.map((call) => call[0]);
      const logsWithLabel = logCalls.filter((msg) =>
        msg.includes('[TEST_INSTANCE]'),
      );
      expect(logsWithLabel.length).toBeGreaterThan(0);

      logSpy.mockClear();
      errorSpy.mockClear();

      // Test with failed request - should log errors with instance label
      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatAlwaysFails,
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        fakeFetchImplThatAlwaysFails,
      );

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow(/All attempts to do ETH1 RPC request failed/);

      const errorCalls = errorSpy.mock.calls.map((call) => call[0]);
      const errorsWithLabel = errorCalls.filter(
        (msg) => typeof msg === 'string' && msg.includes('[TEST_INSTANCE]'),
      );
      expect(errorsWithLabel.length).toBeGreaterThan(0);

      logSpy.mockRestore();
      errorSpy.mockRestore();
    });

    test('should log RPC method in logs', async () => {
      await createMocks(2);

      const logSpy = jest.spyOn(mockedProvider['logger'], 'log');

      // Use getTransactionReceipt which reliably triggers perform()
      await mockedProvider.getTransactionReceipt(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );

      const logCalls = logSpy.mock.calls.map((call) => call[0]);
      // Check that logs contain method name
      const logsWithMethod = logCalls.filter(
        (msg) =>
          typeof msg === 'string' && msg.includes('getTransactionReceipt'),
      );
      expect(logsWithMethod.length).toBeGreaterThan(0);

      logSpy.mockRestore();
    });

    test('should include method in error messages', async () => {
      await createMocks(1, 1, 1, 1);

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatCanOnlyDoNetworkDetection,
      );

      let caughtError: AllProvidersFailedError | null = null;
      try {
        // Use getBlock like other tests - it triggers getBlockNumber internally
        await mockedProvider.getBlock(10000);
      } catch (e) {
        caughtError = e as AllProvidersFailedError;
      }

      expect(caughtError).toBeInstanceOf(AllProvidersFailedError);
      // Error message should include method name
      expect(caughtError?.message).toMatch(/getBlock/);
    });

    test('should log method name correctly', async () => {
      await createMocks(2);

      const logSpy = jest.spyOn(mockedProvider['logger'], 'log');

      // getTransactionReceipt triggers perform()
      await mockedProvider.getTransactionReceipt(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );

      const logCalls = logSpy.mock.calls.map((call) => call[0]);
      const logsWithGetTransactionReceipt = logCalls.filter(
        (msg) =>
          typeof msg === 'string' && msg.includes('getTransactionReceipt'),
      );
      expect(logsWithGetTransactionReceipt.length).toBeGreaterThan(0);

      logSpy.mockRestore();
    });

    test('should log getLogs method', async () => {
      await createMocks(2);

      const logSpy = jest.spyOn(mockedProvider['logger'], 'log');

      // getLogs triggers perform()
      await mockedProvider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
      });

      const logCalls = logSpy.mock.calls.map((call) => call[0]);
      const logsWithGetLogs = logCalls.filter(
        (msg) => typeof msg === 'string' && msg.includes('getLogs'),
      );
      expect(logsWithGetLogs.length).toBeGreaterThan(0);

      logSpy.mockRestore();
    });

    test('should work when logger.debug is undefined', async () => {
      await createMocks(2);

      // Remove debug method to test optional chaining branch
      const originalDebug = mockedProvider['logger'].debug;
      mockedProvider['logger'].debug = undefined;

      // Should not throw when debug is undefined
      await mockedProvider.getBlock(42);

      // Restore
      mockedProvider['logger'].debug = originalDebug;
    });

    // This test must be last - it creates provider without RPC calls,
    // which can leave ethers internal timers in undefined state
    test('should format logs correctly without instanceLabel', async () => {
      await createMocks(
        2,
        1,
        1,
        1,
        false,
        null,
        undefined,
        undefined,
        undefined,
        undefined, // no instanceLabel
      );

      // Test formatLog without instanceLabel
      const formatted = mockedProvider['formatLog']('test message', 1);
      expect(formatted).toContain('[provider:1]');
      expect(formatted).toContain('test message');
      expect(formatted).not.toContain('undefined');
    });
  });
});
