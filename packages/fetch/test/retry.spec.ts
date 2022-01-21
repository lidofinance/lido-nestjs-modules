jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { FetchModule, FetchService, RequestRetryPolicy } from '../src';
import fetch from 'node-fetch';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Retries', () => {
  const url = '/foo';
  let fetchService: FetchService;

  const initModule = async (retryPolicy?: RequestRetryPolicy) => {
    const fetchModule = FetchModule.forRoot({ retryPolicy });
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

    test('should not retry', async () => {
      const retryPolicy = { count: 0 };
      await initModule(retryPolicy);

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
    });

    test('should not retry once', async () => {
      const retryPolicy = { count: 1 };
      await initModule(retryPolicy);

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(2);
    });
  });

  describe('Local retry policy', () => {
    beforeEach(async () => {
      await initModule();
      mockFetch.mockImplementation(() => Promise.reject(new Error()));
    });

    test('should not retry', async () => {
      const retryPolicy = { count: 0 };

      await expect(
        fetchService.fetchJson(url, { retryPolicy }),
      ).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
    });

    test('should not retry once', async () => {
      const retryPolicy = { count: 1 };

      await expect(
        fetchService.fetchJson(url, { retryPolicy }),
      ).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(2);
    });
  });
});
