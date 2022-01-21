jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { FetchModule, FetchService, RequestRetryPolicy } from '../src';
import fetch from 'node-fetch';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Base urls', () => {
  const url = '/foo';
  let fetchService: FetchService;

  const initModule = async (
    baseUrls?: string[],
    retryPolicy?: RequestRetryPolicy,
  ) => {
    const fetchModule = FetchModule.forRoot({ baseUrls, retryPolicy });
    const testModule = { imports: [fetchModule] };
    const moduleRef = await Test.createTestingModule(testModule).compile();

    fetchService = moduleRef.get(FetchService);
  };

  beforeEach(async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error()));
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe('One base url', () => {
    test('With base url', async () => {
      const baseUrls = ['http://foo.bar'];
      await initModule(baseUrls);

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(baseUrls[0] + url, undefined);
    });

    test('Without base url', async () => {
      const baseUrl = undefined;
      await initModule(baseUrl);

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(url, undefined);
    });

    test('Absolute url', async () => {
      const baseUrls = ['http://foo.bar'];
      const expected = 'http://baz.qiz';
      await initModule(baseUrls);

      await expect(fetchService.fetchJson(expected)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(expected, undefined);
    });
  });

  describe('Fallbacks', () => {
    const baseUrls = ['http://foo', 'http://bar', 'http://baz'];

    test('Without retries', async () => {
      const retryPolicy = { attempts: 0, delay: 0 };
      await initModule(baseUrls, retryPolicy);

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(baseUrls[0] + url, undefined);
    });

    test('One retry', async () => {
      const retryPolicy = { attempts: 1, delay: 0 };
      await initModule(baseUrls, retryPolicy);

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe(baseUrls[0] + url);
      expect(mockFetch.mock.calls[1][0]).toBe(baseUrls[1] + url);
    });

    test('Loop retries', async () => {
      const retryPolicy = { attempts: 4, delay: 0 };
      await initModule(baseUrls, retryPolicy);

      await expect(fetchService.fetchJson(url)).rejects.toThrow();
      expect(mockFetch).toBeCalledTimes(5);
      expect(mockFetch.mock.calls[0][0]).toBe(baseUrls[0] + url);
      expect(mockFetch.mock.calls[1][0]).toBe(baseUrls[1] + url);
      expect(mockFetch.mock.calls[2][0]).toBe(baseUrls[2] + url);
      expect(mockFetch.mock.calls[3][0]).toBe(baseUrls[0] + url);
      expect(mockFetch.mock.calls[4][0]).toBe(baseUrls[1] + url);
    });
  });
});
