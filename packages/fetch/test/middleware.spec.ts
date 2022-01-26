jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { FetchModuleOptions } from '../src/interfaces/fetch.interface';
import { FetchModule, FetchService } from '../src';
import fetch from 'node-fetch';

const { Response } = jest.requireActual('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Middleware', () => {
  const expected = { foo: 'bar' };
  let fetchService: FetchService;

  const initModule = async (
    middlewares?: FetchModuleOptions['middlewares'],
  ) => {
    const fetchModule = FetchModule.forRoot({ middlewares });
    const testModule = { imports: [fetchModule] };
    const moduleRef = await Test.createTestingModule(testModule).compile();

    fetchService = moduleRef.get(FetchService);
  };

  beforeEach(() => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(expected))),
    );
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  test('Before', async () => {
    await initModule([
      async (next) => {
        mockFetch('1');
        return await next();
      },
    ]);

    await fetchService.fetchJson('2');
    expect(mockFetch).toBeCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe('1');
    expect(mockFetch.mock.calls[1][0]).toBe('2');
  });

  test('After', async () => {
    await initModule([
      async (next) => {
        const result = await next();
        mockFetch('2');
        return result;
      },
    ]);

    await fetchService.fetchJson('1');
    expect(mockFetch).toBeCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe('1');
    expect(mockFetch.mock.calls[1][0]).toBe('2');
  });
});
