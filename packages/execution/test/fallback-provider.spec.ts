/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  ExecutionModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import {
  fakeFetchImpl,
  fakeFetchImplThatAlwaysFails,
  fakeFetchImplThatCanOnlyDoNetworkDetection,
  fixtures,
  makeFetchImplWithSpecificNetwork,
} from './fixtures/fake-json-rpc';
import { jsonTransport, LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';
import { range } from './utils';
import { NonEmptyArray } from '../dist/interfaces/non-empty-array';

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
      urls: NonEmptyArray<string | ConnectionInfo> | null = null,
    ) => {
      const module = {
        imports: [
          ExecutionModule.forFeature({
            imports: [LoggerModule.forRoot({ transports: [jsonTransport()] })],
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
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(SimpleFallbackJsonRpcBatchProvider);

      range(0, fallbackProvidersQty).forEach((i) => {
        if (mockedProvider.fallbackProviders[i]) {
          mockedFallbackProviderFetch[i] = jest
            .spyOn(mockedProvider.fallbackProviders[i].provider, 'fetchJson')
            .mockImplementation(fakeFetchImpl);

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

      const block = await mockedProvider.getBlock(10000);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);

      // 2 calls here because first 'getBlock' call
      // will initiate 'detectNetwork' fetch and 'getBlock' fetch
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.hash);

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

      const block = await mockedProvider.getBlock(10000);
      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(1);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(2);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.hash);
    });

    test("shouldn't fallback to next provider if first provider is ok", async () => {
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

    test('should throw exception when only 1 fallback provider supplied that can only do network detection', async () => {
      await createMocks(1, 1, 1, 1);

      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatCanOnlyDoNetworkDetection,
      );

      // first provider should will do network detection and then 'getBlock'
      await expect(
        async () => await mockedProvider.getBlock(10000),
      ).rejects.toThrow('All attempts failed');

      expect(mockedProviderDetectNetwork).toBeCalledTimes(1);
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(2);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(2);
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
        'No valid fallback providers found (all fallback endpoints unreachable)',
      );
    });

    test('should fail when all networks are different', async () => {
      await createMocks(2);

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFetchImplWithSpecificNetwork(1),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFetchImplWithSpecificNetwork(2),
      );

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow('Provider networks mismatch');
    });

    test('should fail when all networks are not equal to predefined network', async () => {
      // TODO
    });

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
      ).rejects.toThrow('Provider networks mismatch');
    });

    test('should support middleware for fetching', async () => {
      // TODO
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
  });
});
