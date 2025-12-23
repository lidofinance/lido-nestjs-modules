/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import {
  ExtendedJsonRpcBatchProvider,
  FallbackProviderModule,
  SimpleFallbackJsonRpcBatchProvider,
  TransactionWaitTimeoutError,
} from '../src';
import {
  fakeFetchImpl,
  makeFakeFetchImplWithPendingReceipt,
  makeFakeFetchImplThatFailsOnReceipt,
} from './fixtures/fake-json-rpc';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';
import { ConnectionInfo } from '@ethersproject/web';
import { range, sleep } from './utils';

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

/**
 * Tests for waitForTransactionWithFallback method.
 *
 * This method was created to solve the critical issue with ethers.js tx.wait()
 * that hangs indefinitely when RPC providers fail. The native ethers.js approach
 * swallows all errors via emit("error") and never rejects the Promise.
 *
 * @see https://github.com/ethers-io/ethers.js/blob/v5.8.0/packages/providers/src.ts/base-provider.ts#L1076
 */
describe('Execution module - waitForTransactionWithFallback', () => {
  jest.setTimeout(30000);
  let mockedProvider: MockedSimpleFallbackJsonRpcBatchProvider;
  const mockedFallbackProviderFetch: jest.SpyInstance[] = [];

  const createMocks = async (
    fallbackProvidersQty = 2,
    maxRetries = 1,
    requestTimeoutMs?: number,
  ) => {
    const module = {
      imports: [
        FallbackProviderModule.forFeature({
          imports: [LoggerModule.forRoot({ transports: [nullTransport()] })],
          urls: <[string]>(
            range(0, fallbackProvidersQty).map(
              (i: number) => `http://localhost:100${i}`,
            )
          ),
          requestPolicy: {
            jsonRpcMaxBatchSize: 10,
            batchAggregationWaitMs: 10,
            maxConcurrentRequests: 10,
          },
          network: 1,
          maxRetries,
          logRetries: false,
          requestTimeoutMs,
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
      }
    });
  };

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe('successful scenarios', () => {
    test('should return receipt when transaction is already confirmed', async () => {
      await createMocks(2);

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10); // Wait for network detection

      const result = await mockedProvider.waitForTransactionWithFallback(
        txHash,
        {
          timeout: 5000,
          pollInterval: 100,
          confirmations: 1,
        },
      );

      expect(result.receipt).toBeDefined();
      expect(result.receipt.transactionHash).toBe(txHash);
      expect(result.pollCount).toBe(1);
      expect(result.elapsedMs).toBeLessThan(5000);
    });

    test('should wait and return receipt when transaction becomes confirmed after pending', async () => {
      await createMocks(2);

      // First 2 calls return null (pending), then return valid receipt
      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplWithPendingReceipt(2, 1),
      );

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10); // Wait for network detection

      const result = await mockedProvider.waitForTransactionWithFallback(
        txHash,
        {
          timeout: 5000,
          pollInterval: 100,
          confirmations: 1,
        },
      );

      expect(result.receipt).toBeDefined();
      expect(result.receipt.transactionHash).toBe(txHash);
      expect(result.pollCount).toBe(3); // 2 pending + 1 confirmed
    });

    test('should use custom timeout option', async () => {
      await createMocks(2);

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      const result = await mockedProvider.waitForTransactionWithFallback(
        txHash,
        { timeout: 5000 },
      );

      expect(result.receipt).toBeDefined();
      expect(result.pollCount).toBe(1);
    });

    test('should use default options when none provided', async () => {
      await createMocks(2);

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      // Call with empty options to cover default values branch
      const result = await mockedProvider.waitForTransactionWithFallback(
        txHash,
      );

      expect(result.receipt).toBeDefined();
      expect(result.pollCount).toBe(1);
    });
  });

  describe('timeout scenarios', () => {
    test('should throw TransactionWaitTimeoutError when timeout is reached', async () => {
      await createMocks(2);

      // Always return null (transaction never confirms)
      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplWithPendingReceipt(100, 1), // 100 pending calls
      );

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      await expect(
        mockedProvider.waitForTransactionWithFallback(txHash, {
          timeout: 500, // Short timeout
          pollInterval: 100,
          confirmations: 1,
        }),
      ).rejects.toThrow(TransactionWaitTimeoutError);
    });

    test('should include transaction hash and timeout in error', async () => {
      await createMocks(2);

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplWithPendingReceipt(100, 1),
      );

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      try {
        await mockedProvider.waitForTransactionWithFallback(txHash, {
          timeout: 500,
          pollInterval: 100,
        });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TransactionWaitTimeoutError);
        const txError = error as TransactionWaitTimeoutError;
        expect(txError.txHash).toBe(txHash);
        expect(txError.timeoutMs).toBe(500);
        expect(txError.lastError).toBeNull(); // No provider errors, just pending
      }
    });
  });

  describe('fallback provider behavior', () => {
    test('should switch to next provider when first provider fails', async () => {
      await createMocks(2, 1); // 1 retry

      // First provider always fails on getTransactionReceipt
      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplThatFailsOnReceipt(),
      );
      // Second provider works normally
      mockedFallbackProviderFetch[1].mockImplementation(fakeFetchImpl());

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      const result = await mockedProvider.waitForTransactionWithFallback(
        txHash,
        {
          timeout: 10000,
          pollInterval: 100,
        },
      );

      expect(result.receipt).toBeDefined();
      expect(mockedFallbackProviderFetch[1]).toHaveBeenCalled();
    });

    test('should throw timeout error with lastError when all providers fail', async () => {
      await createMocks(2, 1); // 2 providers, 1 retry

      // Both providers fail on getTransactionReceipt
      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplThatFailsOnReceipt(),
      );
      mockedFallbackProviderFetch[1].mockImplementation(
        makeFakeFetchImplThatFailsOnReceipt(),
      );

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      try {
        await mockedProvider.waitForTransactionWithFallback(txHash, {
          timeout: 1000,
          pollInterval: 100,
        });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TransactionWaitTimeoutError);
        const txError = error as TransactionWaitTimeoutError;
        expect(txError.txHash).toBe(txHash);
        // lastError should be set because providers failed
        expect(txError.lastError).not.toBeNull();
        expect(txError.message).toContain('Last provider error');
      }
    });
  });

  describe('confirmations behavior', () => {
    test('should accept confirmations parameter', async () => {
      await createMocks(2);

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      // Default confirmations = 1, should pass immediately
      const result = await mockedProvider.waitForTransactionWithFallback(
        txHash,
        {
          timeout: 5000,
          pollInterval: 100,
          confirmations: 1,
        },
      );

      expect(result.receipt).toBeDefined();
      expect(result.receipt.confirmations).toBeGreaterThanOrEqual(1);
    });
  });

  describe('timing invariants', () => {
    test('should respect pollInterval between attempts', async () => {
      await createMocks(2);

      const pollInterval = 200;
      const pendingPolls = 3;

      // First 3 calls return null (pending), then return valid receipt
      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplWithPendingReceipt(pendingPolls, 1),
      );

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      const result = await mockedProvider.waitForTransactionWithFallback(
        txHash,
        {
          timeout: 5000,
          pollInterval,
          confirmations: 1,
        },
      );

      // Should have waited at least pendingPolls * pollInterval
      const minExpectedTime = pendingPolls * pollInterval;
      expect(result.elapsedMs).toBeGreaterThanOrEqual(minExpectedTime - 50); // 50ms tolerance
      expect(result.pollCount).toBe(pendingPolls + 1);
    });

    test('should timeout close to specified timeout value', async () => {
      await createMocks(2);

      const timeout = 500;

      mockedFallbackProviderFetch[0].mockImplementation(
        makeFakeFetchImplWithPendingReceipt(100, 1),
      );

      const txHash =
        '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489';

      await sleep(10);

      const start = Date.now();
      try {
        await mockedProvider.waitForTransactionWithFallback(txHash, {
          timeout,
          pollInterval: 50,
        });
        fail('Expected error');
      } catch (error) {
        const elapsed = Date.now() - start;
        // Should timeout within reasonable bounds
        expect(elapsed).toBeGreaterThanOrEqual(timeout - 50);
        expect(elapsed).toBeLessThan(timeout + 200); // allow some overhead
      }
    });
  });
});
