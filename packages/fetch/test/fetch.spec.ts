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

  describe('Success', () => {
    beforeEach(async () => {
      const module = { imports: [FetchModule.forFeature()] };
      const moduleRef = await Test.createTestingModule(module).compile();
      fetchService = moduleRef.get(FetchService);
    });

    test('should fetch json', async () => {
      const expected = { foo: 'bar' };
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(expected))),
      );

      const result = await fetchService.fetchJson(url);
      expect(result).toEqual(expected);
    });

    test('should fetch text', async () => {
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

    test('should reject on error', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('error')));
      await expect(fetchService.fetchJson(url)).rejects.toThrowError();
    });

    test('should reject with error message', async () => {
      const expectedStatus = 401;
      const expectedBody = { message: 'Something went wrong' };
      const expectedInit = { status: expectedStatus };

      mockFetch.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(expectedBody), expectedInit),
        ),
      );

      await expect(fetchService.fetchJson(url)).rejects.toThrow(HttpException);
      await expect(fetchService.fetchJson(url)).rejects.toMatchObject({
        ...expectedBody,
        ...expectedInit,
      });
    });

    test('should reject with default message', async () => {
      const expectedStatus = 500;
      const expectedInit = { status: expectedStatus };

      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(null, expectedInit)),
      );

      await expect(fetchService.fetchJson(url)).rejects.toThrow(HttpException);
      await expect(fetchService.fetchJson(url)).rejects.toMatchObject({
        message: 'Internal Server Error',
        ...expectedInit,
      });
    });
  });
});
