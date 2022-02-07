import { Test } from '@nestjs/testing';
import { ExtendedJsonRpcBatchProvider, ExecutionModule } from '../src';
import { ConnectionInfo } from '@ethersproject/web';
import { fakeFetchImpl } from './fixtures/fake-json-rpc';
import { range } from './utils';

type MockedExtendedJsonRpcBatchProvider = ExtendedJsonRpcBatchProvider & {
  fetchJson: (
    connection: string | ConnectionInfo,
    json?: string,
  ) => Promise<unknown>;
};

describe('Execution module. ', () => {
  describe('ExtendedJsonRpcBatchProvider', () => {
    let extendedJsonRpcBatchProvider: MockedExtendedJsonRpcBatchProvider;
    let mockRpcProviderFetch: jest.SpyInstance;
    let mockDetectNetwork: jest.SpyInstance;

    const createMocks = async (
      jsonRpcMaxBatchSize: number,
      maxConcurrentRequests: number,
    ) => {
      const module = {
        imports: [
          ExecutionModule.forFeature({
            url: 'http://localhost',
            requestPolicy: {
              jsonRpcMaxBatchSize,
              batchAggregationWaitMs: 10,
              maxConcurrentRequests,
            },
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      extendedJsonRpcBatchProvider = moduleRef.get(
        ExtendedJsonRpcBatchProvider,
      );

      mockRpcProviderFetch = jest
        .spyOn(extendedJsonRpcBatchProvider, 'fetchJson')
        .mockImplementation(fakeFetchImpl);

      mockDetectNetwork = jest.spyOn(
        extendedJsonRpcBatchProvider,
        'detectNetwork',
      );
    };

    // beforeEach(async () => {});

    afterEach(async () => mockRpcProviderFetch.mockReset());

    test('should do network detection only once (detect network is cached)', async () => {
      await createMocks(1, 1);

      expect(mockRpcProviderFetch).toBeCalledTimes(0);
      expect(mockDetectNetwork).toBeCalledTimes(0);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(mockRpcProviderFetch).toBeCalledTimes(1);
      expect(mockDetectNetwork).toBeCalledTimes(2);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(mockRpcProviderFetch).toBeCalledTimes(1);
      expect(mockDetectNetwork).toBeCalledTimes(3);

      await extendedJsonRpcBatchProvider.getBlock(10000);
      expect(mockRpcProviderFetch).toBeCalledTimes(2);
      expect(mockDetectNetwork).toBeCalledTimes(4);
    });

    test('should do no batching when batch size = 1, total = 1', async () => {
      await createMocks(1, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(mockRpcProviderFetch).toBeCalledTimes(1);

      await Promise.all([extendedJsonRpcBatchProvider.getBlock(10000)]);

      expect(mockRpcProviderFetch).toBeCalledTimes(2);
    });

    test('should do no batching when batch size = 1, total = 6', async () => {
      await createMocks(1, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(mockRpcProviderFetch).toBeCalledTimes(1);

      await Promise.all(
        range(0, 6).map(() => extendedJsonRpcBatchProvider.getBlock(10000)),
      );

      expect(mockRpcProviderFetch).toBeCalledTimes(7);
    });

    test('should do proper batching when batch size = 3, total = 6', async () => {
      await createMocks(3, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(mockRpcProviderFetch).toBeCalledTimes(1);

      await Promise.all(
        range(0, 6).map(() => extendedJsonRpcBatchProvider.getBlock(10000)),
      );

      expect(mockRpcProviderFetch).toBeCalledTimes(3);
    });

    test('should do no batching when batch size = 10, total = 6', async () => {
      await createMocks(10, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(mockRpcProviderFetch).toBeCalledTimes(1);

      await Promise.all(
        range(0, 6).map(() => extendedJsonRpcBatchProvider.getBlock(10000)),
      );

      expect(mockRpcProviderFetch).toBeCalledTimes(2);
    });
  });
});
