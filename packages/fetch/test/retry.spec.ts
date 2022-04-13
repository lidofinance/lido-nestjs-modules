jest.mock('node-fetch');

import { performance } from 'perf_hooks';
import { Test } from '@nestjs/testing';
import {
  FetchModule,
  FetchService,
  FetchModuleOptions,
  FETCH_GLOBAL_RETRY_DEFAULT_DELAY,
} from '../src';
import fetch from 'node-fetch';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Retries', () => {
  const url = '/foo';
  let fetchService: FetchService;

  const initModule = async (options?: FetchModuleOptions) => {
    const fetchModule = FetchModule.forRoot(options);
    const testModule = { imports: [fetchModule] };
    const moduleRef = await Test.createTestingModule(testModule).compile();

    fetchService = moduleRef.get(FetchService);
  };

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe('Global retry policy', () => {
    beforeEach(async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error()));
    });

    test('Without retries', async () => {
      const retryPolicy = { attempts: 0, delay: 0 };
      await initModule({ retryPolicy });

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
    });

    test('One retry', async () => {
      const retryPolicy = { attempts: 1, delay: 0 };
      await initModule({ retryPolicy });

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(2);
    });
  });

  describe('Local retry policy', () => {
    beforeEach(async () => {
      await initModule();
      mockFetch.mockImplementation(() => Promise.reject(new Error()));
    });

    test('Without retries', async () => {
      const retryPolicy = { attempts: 0, delay: 0 };

      await expect(
        fetchService.fetchJson(url, { retryPolicy }),
      ).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
    });

    test('One retry', async () => {
      const retryPolicy = { attempts: 1, delay: 0 };

      await expect(
        fetchService.fetchJson(url, { retryPolicy }),
      ).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(2);
    });
  });

  describe('Global + local retry policy', () => {
    beforeEach(async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error()));
    });

    test('Without retries', async () => {
      const globalRetryPolicy = { attempts: 1, delay: 0 };
      const localRetryPolicy = { attempts: 0, delay: 0 };
      await initModule({ retryPolicy: globalRetryPolicy });

      await expect(
        fetchService.fetchJson(url, { retryPolicy: localRetryPolicy }),
      ).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
    });

    test('Two retries', async () => {
      const globalRetryPolicy = { attempts: 1, delay: 0 };
      const localRetryPolicy = { attempts: 2, delay: 0 };
      await initModule({ retryPolicy: globalRetryPolicy });

      await expect(
        fetchService.fetchJson(url, { retryPolicy: localRetryPolicy }),
      ).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(3);
    });
  });

  describe('Delay', () => {
    const executionTime = async (callback: () => void) => {
      const startTime = performance.now();
      try {
        await callback();
      } catch (error) {
        //
      }
      const endTime = performance.now();
      return Math.ceil(endTime - startTime);
    };

    beforeEach(async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error()));
    });

    test(
      'Default',
      async () => {
        const retryPolicy = { attempts: 1 };
        await initModule({ retryPolicy });

        const time = await executionTime(() => fetchService.fetchJson(url));
        expect(mockFetch).toBeCalledTimes(2);
        expect(time).toBeGreaterThanOrEqual(FETCH_GLOBAL_RETRY_DEFAULT_DELAY);
      },
      FETCH_GLOBAL_RETRY_DEFAULT_DELAY + 500,
    );

    test('Global', async () => {
      const retryPolicy = { attempts: 1, delay: 20 };
      await initModule({ retryPolicy });

      const time = await executionTime(() => fetchService.fetchJson(url));
      expect(mockFetch).toBeCalledTimes(2);
      expect(time).toBeGreaterThanOrEqual(retryPolicy.delay);
    });

    test('Local', async () => {
      const retryPolicy = { attempts: 1, delay: 20 };
      await initModule();

      const time = await executionTime(() =>
        fetchService.fetchJson(url, { retryPolicy }),
      );
      expect(mockFetch).toBeCalledTimes(2);
      expect(time).toBeGreaterThanOrEqual(retryPolicy.delay);
    });

    test('Global + local', async () => {
      const localRetryPolicy = { attempts: 1, delay: 20 };
      const globalRetryPolicy = { attempts: 1, delay: 500 };
      await initModule({ retryPolicy: globalRetryPolicy });

      const time = await executionTime(() =>
        fetchService.fetchJson(url, { retryPolicy: localRetryPolicy }),
      );
      expect(mockFetch).toBeCalledTimes(2);
      expect(time).toBeGreaterThanOrEqual(localRetryPolicy.delay);
    });
  });
});
