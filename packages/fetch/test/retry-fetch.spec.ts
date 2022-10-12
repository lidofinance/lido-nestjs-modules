/* eslint-disable @typescript-eslint/ban-ts-comment */
jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import {
  FetchException,
  FetchModule,
  FetchService,
  RequestRetryPolicy,
} from '../src';
import fetch from 'node-fetch';
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

function setupFetchStub(data: string | object) {
  return function fetchStub() {
    return new Promise((resolve) => {
      resolve({
        ok: true,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(data),
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
    const fetchModule = FetchModule.forRoot({
      baseUrls,
      retryPolicy,
      middlewares: [
        async (next) => {
          return await next();
        },
      ],
    });
    const testModule = { imports: [fetchModule] };
    const moduleRef = await Test.createTestingModule(testModule).compile();

    fetchService = moduleRef.get(FetchService);
  };

  afterEach(() => {
    mockFetch.mockReset();
  });

  test('Fetch json empty', async () => {
    mockFetch.mockImplementation(setupFetchStub({ test: 1 }) as never);
    await initModule(baseUrls);

    try {
      await fetchService.fetchJson<{ test: 1 }>(url, {
        retryPolicy: {
          attempts: 1,
          delay: 0,
        },
        middlewares: [
          () => {
            throw new FetchException('Request limit', 500);
          },
        ],
      });
      // eslint-disable-next-line no-empty
    } catch (e) {}

    expect(mockFetch).toBeCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(baseUrls[0] + url);
    expect(mockFetch.mock.calls[1][0]).toBe(baseUrls[1] + url);
  });

  test('Fetch text empty', async () => {
    mockFetch.mockImplementation(setupFetchStub('some text') as never);
    await initModule(baseUrls);

    try {
      await fetchService.fetchText(url, {
        retryPolicy: {
          attempts: 1,
          delay: 0,
        },
        middlewares: [
          () => {
            throw new FetchException('Request limit', 500);
          },
        ],
      });
      // eslint-disable-next-line no-empty
    } catch (e) {}

    expect(mockFetch).toBeCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(baseUrls[0] + url);
    expect(mockFetch.mock.calls[1][0]).toBe(baseUrls[1] + url);
  });

  test('Fetch json with branched serializer', async () => {
    mockFetch.mockImplementation(setupFetchStub({ test: 100 }) as never);
    await initModule(baseUrls);
    let res;
    try {
      res = await fetchService.fetchJson<{ test: number }>(url, {
        retryPolicy: {
          attempts: 1,
          delay: 0,
        },
        middlewares: [
          (next, payload) => {
            mockFetch.mockImplementation(
              setupFetchStub({ test: 200 }) as never,
            );
            // @ts-ignore
            if (payload && payload.data.test === 100) {
              throw new FetchException('Request limit', 500);
            }
            return next();
          },
        ],
      });
      // eslint-disable-next-line no-empty
    } catch (e) {}

    expect(res).toEqual({ test: 200 });
    expect(mockFetch).toBeCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(baseUrls[0] + url);
    expect(mockFetch.mock.calls[1][0]).toBe(baseUrls[1] + url);
  });
});
