jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { FetchModule, FetchService, RequestRetryPolicy } from '../src';
import fetch from 'node-fetch';
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

function setupFetchStub(data: string | object) {
  return function fetchStub() {
    return new Promise((resolve) => {
      resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data,
          }),
        text: () =>
          Promise.resolve({
            data,
          }),
      });
    });
  };
}

describe('Base urls', () => {
  const url = '/foo';
  let fetchService: FetchService;
  const baseUrls = ['http://foo', 'http://bar', 'http://baz'];
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
    mockFetch.mockImplementation(setupFetchStub({ test: 1 }) as never);
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  test('Fetch json empty validator', async () => {
    await initModule(baseUrls);

    try {
      await fetchService.fetchJson<{ test: 1 }>(url, {
        retryPolicy: {
          attempts: 1,
          delay: 0,
        },
        serializer: async () => {
          throw new Error('Request limit');
        },
      });
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(mockFetch).toBeCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(baseUrls[0] + url);
    expect(mockFetch.mock.calls[1][0]).toBe(baseUrls[1] + url);
  });

  test('Fetch text empty validator', async () => {
    await initModule(baseUrls);

    try {
      await fetchService.fetchText(url, {
        retryPolicy: {
          attempts: 1,
          delay: 0,
        },
        serializer: async () => {
          throw new Error('Request limit');
        },
      });
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(mockFetch).toBeCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(baseUrls[0] + url);
    expect(mockFetch.mock.calls[1][0]).toBe(baseUrls[1] + url);
  });
});
