import { Test } from '@nestjs/testing';
import { ExtendedJsonRpcBatchProvider, ExecutionModule } from '../src';
import { ConnectionInfo } from '@ethersproject/web';
import { fakeFetchImpl } from './fixtures/fake-json-rpc';
import { range } from './utils';
import { LoggerModule } from '@lido-nestjs/logger';
import { JsonRpcRequest, JsonRpcResponse } from '../dist';

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
    ) => {
      const module = {
        imports: [
          ExecutionModule.forFeature({
            imports: [LoggerModule.forRoot({})],
            urls: ['http://localhost'],
            requestPolicy: {
              jsonRpcMaxBatchSize,
              batchAggregationWaitMs: 10,
              maxConcurrentRequests,
            },
            network: 1,
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(ExtendedJsonRpcBatchProvider);

      mockedProviderFetch = jest
        .spyOn(mockedProvider, 'fetchJson')
        .mockImplementation(fakeFetchImpl);

      mockedDetectNetwork = jest.spyOn(mockedProvider, 'detectNetwork');
    };

    // beforeEach(async () => {});

    afterEach(async () => mockedProviderFetch.mockReset());

    test('should do network detection only once (detect network is cached)', async () => {
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
  });
});
