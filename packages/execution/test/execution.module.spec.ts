import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  ExecutionModule,
  ExecutionModuleOptions,
} from '../src';
import { ConnectionInfo } from '@ethersproject/web';
import { fakeJsonRpc } from './fixtures/fake-json-rpc';

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

    beforeEach(async () => {
      const options: ExecutionModuleOptions = {
        url: 'http://localhost',
        requestPolicy: {
          jsonRpcMaxBatchSize: 3,
          batchAggregationWaitMs: 10,
          maxConcurrentRequests: 10,
        },
      };

      const module = { imports: [ExecutionModule.forFeature(options)] };
      const moduleRef = await Test.createTestingModule(module).compile();
      extendedJsonRpcBatchProvider = moduleRef.get(
        ExtendedJsonRpcBatchProvider,
      );

      rpcProviderMock = jest
        .spyOn(extendedJsonRpcBatchProvider, 'fetchJson')
        .mockImplementation(
          async (
            connection: string | ConnectionInfo,
            json?: string,
          ): Promise<unknown> => {
            const requests = json ? JSON.parse(json) : {};
            return requests.map(fakeJsonRpc);
          },
        );
    });

    afterEach(() => rpcProviderMock.mockReset());

    test('should not batch when (batch size = 1)', async () => {
      await extendedJsonRpcBatchProvider.getNetwork();

      expect(rpcProviderMock).toBeCalledTimes(1);

      await Promise.all([
        extendedJsonRpcBatchProvider.getBlock(10000),
        extendedJsonRpcBatchProvider.getBlock(10000),
        extendedJsonRpcBatchProvider.getBlock(10000),
      ]);

      expect(rpcProviderMock).toBeCalledTimes(2);
    });
  });
});
