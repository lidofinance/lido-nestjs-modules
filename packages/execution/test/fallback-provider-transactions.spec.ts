/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  FallbackProviderModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import {
  fakeFetchImpl,
  fakeFetchImplThatCantDo,
} from './fixtures/fake-json-rpc';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';
import { Wallet } from '@ethersproject/wallet';
import { range, sleep } from './utils';
import { NonEmptyArray } from '../dist/interfaces/non-empty-array';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
import { Network } from '@ethersproject/networks';
import { BigNumber } from '@ethersproject/bignumber';
import {
  TransactionRequest,
  TransactionResponse,
} from '@ethersproject/abstract-provider';
import { Transaction } from '@ethersproject/transactions';

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
    _originalWrapTransaction: SimpleFallbackJsonRpcBatchProvider['_wrapTransaction'];
  };

describe('Execution module. ', () => {
  describe('SimpleFallbackJsonRpcBatchProvider', () => {
    jest.setTimeout(20000);
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

      // this is needed to maintain original _wrapTransaction method
      mockedProvider._originalWrapTransaction = mockedProvider._wrapTransaction;

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

    test('should not change nonce of eth_sendRawTransaction operation on fallback and retries', async () => {
      await createMocks(2, 10, 10, 2);

      const jsons: any[][] = [[], []];

      // first provider always fails on eth_sendRawTransaction, should fallback to next provider
      mockedFallbackProviderFetch[0].mockImplementation(
        (conn: string | ConnectionInfo, json: string) => {
          jsons[0].push(...JSON.parse(json));

          return fakeFetchImplThatCantDo(['eth_sendRawTransaction'])(
            conn,
            json,
          );
        },
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        (conn: string | ConnectionInfo, json: string) => {
          jsons[1].push(...JSON.parse(json));

          return fakeFetchImpl()(conn, json);
        },
      );

      function wrapTransaction(
        this: MockedSimpleFallbackJsonRpcBatchProvider,
        tx: Transaction,
        hash?: string,
        startBlock?: number,
      ): TransactionResponse {
        return this._originalWrapTransaction(tx, tx.hash, startBlock);
      }

      const wrapTransactionMock = jest
        .spyOn(mockedProvider, '_wrapTransaction')
        .mockImplementation(wrapTransaction.bind(mockedProvider));

      const wallet = Wallet.createRandom().connect(mockedProvider);

      const transaction: TransactionRequest = {
        type: 2,
        nonce: 42,
        to: Wallet.createRandom().address,
        value: BigNumber.from(42),
      };

      await sleep(10);
      mockedFallbackProviderFetch[0].mockClear();
      mockedFallbackProviderFetch[1].mockClear();

      const tx = await wallet.populateTransaction(transaction);
      const signedTx = await wallet.signTransaction(tx);
      await mockedProvider.sendTransaction(signedTx);

      expect(wrapTransactionMock).toBeCalledTimes(1);

      const firstProviderEthSendRawTransactionParams = jsons[0]
        .filter((r) => r.method === 'eth_sendRawTransaction')
        .map((r) => r.params[0]);
      const secondProviderEthSendRawTransactionParams = jsons[1]
        .filter((r) => r.method === 'eth_sendRawTransaction')
        .map((r) => r.params[0]);

      // ensuring that all eth_sendRawTransaction are equal
      expect(firstProviderEthSendRawTransactionParams.length).toBe(2);
      expect(secondProviderEthSendRawTransactionParams.length).toBe(1);
      expect(firstProviderEthSendRawTransactionParams[0]).toBe(
        secondProviderEthSendRawTransactionParams[0],
      );
      expect(firstProviderEthSendRawTransactionParams[0]).toBe(
        firstProviderEthSendRawTransactionParams[1],
      );

      // Methods:
      // eth_chainId (on init) + batch[eth_gasPrice + eth_getBlockByNumber] + eth_estimateGas + eth_blockNumber + eth_sendRawTransaction (failed) + eth_sendRawTransaction (failed)
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(6);
      // eth_chainId (on init) + eth_sendRawTransaction
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(2);

      // just in case - check
      expect(mockedProviderDetectNetwork).toBeCalledTimes(6);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(7);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(7);
    });

    test('should work when WRITE operations fail on first endpoint', async () => {
      await createMocks(2, 10, 10, 2);

      // first provider always fails on eth_sendRawTransaction or eth_getBlockByNumber
      mockedFallbackProviderFetch[0].mockImplementation(
        fakeFetchImplThatCantDo([
          'eth_sendRawTransaction',
          'eth_getBlockByNumber',
        ]),
      );
      mockedFallbackProviderFetch[1].mockImplementation(fakeFetchImpl());

      function wrapTransaction(
        this: MockedSimpleFallbackJsonRpcBatchProvider,
        tx: Transaction,
        hash?: string,
        startBlock?: number,
      ): TransactionResponse {
        return this._originalWrapTransaction(tx, tx.hash, startBlock);
      }

      const wrapTransactionMock = jest
        .spyOn(mockedProvider, '_wrapTransaction')
        .mockImplementation(wrapTransaction.bind(mockedProvider));

      const wallet = Wallet.createRandom().connect(mockedProvider);

      const transaction: TransactionRequest = {
        type: 2,
        nonce: 42,
        to: Wallet.createRandom().address,
        value: BigNumber.from(42),
      };

      await sleep(10);
      const tx = await wallet.populateTransaction(transaction);
      const signedTx = await wallet.signTransaction(tx);
      await mockedProvider.sendTransaction(signedTx);

      expect(wrapTransactionMock).toBeCalledTimes(1);

      // Methods:
      // eth_chainId (on init) + batch[eth_gasPrice + eth_getBlockByNumber](failed)+ batch[eth_gasPrice +  eth_getBlockByNumber(failed)](failed)
      expect(mockedFallbackProviderFetch[0]).toBeCalledTimes(3);
      // eth_chainId (on init) + batch[eth_gasPrice + eth_getBlockByNumber] + eth_estimateGas + eth_blockNumber + eth_sendRawTransaction
      expect(mockedFallbackProviderFetch[1]).toBeCalledTimes(5);

      // just in case - check
      expect(mockedProviderDetectNetwork).toBeCalledTimes(6);
      expect(mockedFallbackDetectNetwork[0]).toBeCalledTimes(7);
      expect(mockedFallbackDetectNetwork[1]).toBeCalledTimes(7);
    });
  });
});
