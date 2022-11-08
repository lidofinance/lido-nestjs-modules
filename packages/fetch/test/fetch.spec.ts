jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { FetchModule, FetchService } from '../src';
import fetch from 'node-fetch';

const { Response } = jest.requireActual('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Data fetching', () => {
  const url = '/foo';
  let fetchService: FetchService;

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe('Url types', () => {
    const expected = { foo: 'bar' };

    beforeEach(async () => {
      const module = { imports: [FetchModule.forFeature()] };
      const moduleRef = await Test.createTestingModule(module).compile();
      fetchService = moduleRef.get(FetchService);

      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(expected))),
      );
    });

    test('String', async () => {
      const url = '/foo';
      const result = await fetchService.fetchJson(url);

      expect(result).toEqual(expected);
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(url, expect.anything());
    });

    test('Object', async () => {
      const url = { href: '/foo' };
      const result = await fetchService.fetchJson(url);

      expect(result).toEqual(expected);
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(url, expect.anything());
    });
  });

  describe('Success', () => {
    beforeEach(async () => {
      const module = { imports: [FetchModule.forFeature()] };
      const moduleRef = await Test.createTestingModule(module).compile();
      fetchService = moduleRef.get(FetchService);
    });

    test('JSON', async () => {
      const expected = { foo: 'bar' };
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(expected))),
      );

      const result = await fetchService.fetchJson(url);
      expect(result).toEqual(expected);
    });

    test('Text', async () => {
      const expected = 'foo bar';
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(expected)),
      );

      const result = await fetchService.fetchText(url);
      expect(result).toEqual(expected);
    });
  });

  describe('Rejects', () => {
    beforeEach(async () => {
      const module = { imports: [FetchModule.forFeature()] };
      const moduleRef = await Test.createTestingModule(module).compile();
      fetchService = moduleRef.get(FetchService);
    });

    test('Reject on error', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('error')));
      await expect(fetchService.fetchJson(url)).rejects.toThrowError();
    });

    test('Reject with error message', async () => {
      const expectedStatus = 401;
      const expectedBody = { message: 'Something went wrong' };
      const expectedInit = { status: expectedStatus };

      mockFetch.mockImplementation(() => {
        const res = new Response(JSON.stringify(expectedBody), expectedInit);
        return Promise.resolve(res);
      });

      await expect(fetchService.fetchJson(url)).rejects.toThrow(HttpException);
      await expect(fetchService.fetchJson(url)).rejects.toMatchObject({
        ...expectedBody,
        ...expectedInit,
      });
    });

    test('Reject with default message', async () => {
      const expectedStatus = 500;
      const expectedBody = { message: 'Something went wrong' };
      const expectedInit = { status: expectedStatus };

      mockFetch.mockImplementation(() => {
        const res = new Response(JSON.stringify(expectedBody), expectedInit);
        return Promise.resolve(res);
      });
      await expect(fetchService.fetchJson(url)).rejects.toThrow(HttpException);
      // await expect(fetchService.fetchJson(url)).rejects.toMatchObject({
      //   message:
      //     'invalid json response body at  reason: Unexpected end of JSON input',
      //   ...expectedInit,
      // });
    });
  });
});
