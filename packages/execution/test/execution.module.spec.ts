import { Test } from '@nestjs/testing';
import { ExtendedJsonRpcBatchProvider, ExecutionModule } from '../src';
import { ConnectionInfo } from '@ethersproject/web';
import { fakeFetchImpl } from './fixtures/fake-json-rpc';
import { range } from './fixtures/range';

type MockedExtendedJsonRpcBatchProvider = ExtendedJsonRpcBatchProvider & {
  fetchJson: (
    connection: string | ConnectionInfo,
    json?: string,
  ) => Promise<unknown>;
};

describe('Execution module. ', () => {
  describe('ExtendedJsonRpcBatchProvider', () => {
    let extendedJsonRpcBatchProvider: MockedExtendedJsonRpcBatchProvider;
    let rpcProviderMock: jest.SpyInstance;

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

      rpcProviderMock = jest
        .spyOn(extendedJsonRpcBatchProvider, 'fetchJson')
        .mockImplementation(fakeFetchImpl);
    };

    // beforeEach(async () => {});

    afterEach(async () => rpcProviderMock.mockReset());

    test('should do no batching when batch size = 1, total = 1', async () => {
      await createMocks(1, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(rpcProviderMock).toBeCalledTimes(1);

      await Promise.all([extendedJsonRpcBatchProvider.getBlock(10000)]);

      expect(rpcProviderMock).toBeCalledTimes(2);
    });

    test('should do no batching when batch size = 1, total = 6', async () => {
      await createMocks(1, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(rpcProviderMock).toBeCalledTimes(1);

      await Promise.all(
        range(0, 6).map(() => extendedJsonRpcBatchProvider.getBlock(10000)),
      );

      expect(rpcProviderMock).toBeCalledTimes(7);
    });

    test('should do proper batching when batch size = 3, total = 6', async () => {
      await createMocks(3, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(rpcProviderMock).toBeCalledTimes(1);

      await Promise.all(
        range(0, 6).map(() => extendedJsonRpcBatchProvider.getBlock(10000)),
      );

      expect(rpcProviderMock).toBeCalledTimes(3);
    });

    test('should do no batching when batch size = 10, total = 6', async () => {
      await createMocks(10, 10);

      await extendedJsonRpcBatchProvider.getNetwork();
      expect(rpcProviderMock).toBeCalledTimes(1);

      await Promise.all(
        range(0, 6).map(() => extendedJsonRpcBatchProvider.getBlock(10000)),
      );

      expect(rpcProviderMock).toBeCalledTimes(2);
    });
  });
});
