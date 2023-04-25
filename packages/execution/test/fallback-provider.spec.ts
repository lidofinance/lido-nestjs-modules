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
} from './fixtures/fake-json-rpc';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';
import { range, sleep } from './utils';
import { NonEmptyArray } from '../src/interfaces/non-empty-array';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
import { Network } from '@ethersproject/networks';
import { nonRetryableErrors } from '../src/common/errors';

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
            fetchMiddlewares,
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
      const blockA = await mockedProvider.getBlock('latest');
      expect(blockA.number).toBe(10068);

      // mocking first provider to return certain block data
      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImpl(1, 10032),
      );

      await sleep(2500); // will do a reset

      // data from first provider
      const blockB = await mockedProvider.getBlock('latest');
      expect(blockB.number).toBe(10032);
    });

    test('should throw exception when only 1 fallback provider supplied and it can only do network detection', async () => {
      await createMocks(1, 1, 1, 1);

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatCanOnlyDoNetworkDetection,
      );

      // first provider should will do network detection and then 'getBlock'
      await expect(
        async () => await mockedProvider.getBlock(10000),
      ).rejects.toThrow('All attempts to do ETH1 RPC request failed');

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
        const err = new Error(`CALL_EXCEPTION server error`);
        (<Error & { code: number | string }>err).code = 'CALL_EXCEPTION';
        (<Error & { serverError: object }>err).serverError = {
          code: 'ECONNRESET',
          url: 'http://some-rpc-provider',
        };
        return err;
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

      // 'getBlock' fetch
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(1);

      // 'getBlock' fetch call to second provider that does not fail
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(2);
    });
  });
});
