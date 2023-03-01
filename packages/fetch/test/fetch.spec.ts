jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { FetchModule, FetchService } from '../src';
import fetch from 'node-fetch';
import Stream from 'stream';
import * as fs from 'fs';
import Pick from 'stream-json/filters/Pick';
import { streamValues } from 'stream-json/streamers/StreamValues';

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
      expect(mockFetch).toBeCalledWith(url, undefined);
    });

    test('Object', async () => {
      const url = { href: '/foo' };
      const result = await fetchService.fetchJson(url);

      expect(result).toEqual(expected);
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(url, undefined);
    });

    test('Stream', async () => {
      const url = { href: '/foo' };
      const readStream = fs.createReadStream(
        __dirname + '/fixtures/big-json.json',
      );

      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(readStream)),
      );

      const resultStream = await fetchService.fetchStream(url);

      const jsonStream = resultStream
        .pipe(Pick.withParser({ filter: /^(header|balances\.\d+)$/ }))
        .pipe(streamValues());

      type Chunk = {
        _id: string;
        index: number;
        guid: string;
        balance: number;
      };

      type Header = {
        hid: string;
      };

      const chunks: Chunk[] = [];
      let header: Header | null = null;
      for await (const chunk of jsonStream) {
        if (chunk.key === 0 && 'hid' in chunk.value) {
          header = chunk.value;
          continue;
        }

        if ('_id' in chunk.value && 'balance' in chunk.value) {
          chunks.push(chunk.value);
        }
      }

      expect(header).toEqual({
        hid: '829f7034-d561-4189-a66c-1a3ee5172b1a',
      });

      expect(chunks[0]).toEqual({
        _id: '63fdf0c015cefc509deca76d',
        index: 0,
        guid: 'af83d5f1-db87-42db-8c9d-0e3dd5672b3b',
        balance: 2924,
      });

      expect(chunks[chunks.length - 1]).toEqual({
        _id: '63fdf0c269dbbafb2f3418be',
        index: 22966,
        guid: '33adc4d6-c514-4630-92fe-37b2bb76c0b1',
        balance: 2481.65,
      });

      expect(resultStream).toBeInstanceOf(Stream);
      expect(mockFetch).toBeCalledTimes(1);
      expect(mockFetch).toBeCalledWith(url, undefined);
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

    test('Reject with default message', async () => {
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
