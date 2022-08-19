/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { IpfsGeneralService } from '../../src';
import { HttpException } from '@nestjs/common';

describe('Ipfs service', () => {
  let ipfsService: IpfsGeneralService;
  let httpService: FetchService;

  let mockFetchJson: jest.SpyInstance<
    ReturnType<FetchService['fetchJson']>,
    Parameters<FetchService['fetchJson']>
  >;

  let mockFetchText: jest.SpyInstance<
    ReturnType<FetchService['fetchText']>,
    Parameters<FetchService['fetchText']>
  >;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FetchModule.forRoot()],
      providers: [IpfsGeneralService],
    }).compile();
    ipfsService = moduleRef.get(IpfsGeneralService);
    httpService = moduleRef.get(FetchService);

    mockFetchJson = jest.spyOn(httpService, 'fetchJson');
    mockFetchText = jest.spyOn(httpService, 'fetchText');
  });

  test('Methods are defined', () => {
    expect(ipfsService.add).toBeDefined();
    expect(ipfsService.get).toBeDefined();
  });

  describe('Add', () => {
    test('got expected result', async () => {
      mockFetchJson.mockImplementation(async () => ({
        Name: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        Hash: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        Size: '48',
      }));

      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      const result = await ipfsService.add(param);
      const boundary = 'ipfs-lib';
      const payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${param}\r\n--${boundary}--`;

      expect(mockFetchJson).toBeCalledTimes(1);
      expect(mockFetchJson).toBeCalledWith(
        'http://127.0.0.1:5001/api/v0/add?pin=true',
        {
          body: payload,
          headers: {
            'Content-Type': 'multipart/form-data; boundary=ipfs-lib',
            accept: 'application/json',
          },
          method: 'POST',
        },
      );

      expect(result).toEqual({
        error: null,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: param,
      });
    });

    test('got unexpected result', async () => {
      mockFetchJson.mockImplementation(async () => 'some other result');

      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      const result = await ipfsService.add(
        param,
        'http://127.0.0.1:5001/api/v0/',
      );
      const boundary = 'ipfs-lib';
      const payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${param}\r\n--${boundary}--`;

      expect(mockFetchJson).toBeCalledTimes(1);
      expect(mockFetchJson).toBeCalledWith(
        'http://127.0.0.1:5001/api/v0/add?pin=true',
        {
          body: payload,
          headers: {
            'Content-Type': 'multipart/form-data; boundary=ipfs-lib',
            accept: 'application/json',
          },
          method: 'POST',
        },
      );

      expect(result).toEqual({
        cid: null,
        data: null,
        error: 'Unexpected result: "some other result"',
      });
    });

    test('fetchJson throw exception', async () => {
      mockFetchJson.mockImplementation(() => {
        throw new HttpException('some exception', 404);
      });

      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      const opts: any = {};
      const result = await ipfsService.add(
        param,
        'http://127.0.0.1:5001/api/v0/',
        opts,
      );
      const boundary = 'ipfs-lib';
      const payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${param}\r\n--${boundary}--`;

      expect(mockFetchJson).toBeCalledTimes(1);
      expect(mockFetchJson).toBeCalledWith(
        'http://127.0.0.1:5001/api/v0/add?pin=true',
        {
          body: payload,
          headers: {
            'Content-Type': 'multipart/form-data; boundary=ipfs-lib',
            accept: 'application/json',
          },
          method: 'POST',
        },
      );

      expect(result).toEqual({
        data: null,
        cid: null,
        error: 'Error during fetch, error: some exception',
      });
    });

    test('undefined username|password', async () => {
      mockFetchJson.mockImplementation(async () => ({
        Name: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        Hash: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        Size: '48',
      }));

      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      const opts: any = {};
      const result = await ipfsService.add(
        param,
        'http://127.0.0.1:5001/api/v0/',
        opts,
      );
      const boundary = 'ipfs-lib';
      const payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${param}\r\n--${boundary}--`;

      expect(mockFetchJson).toBeCalledTimes(1);
      expect(mockFetchJson).toBeCalledWith(
        'http://127.0.0.1:5001/api/v0/add?pin=true',
        {
          body: payload,
          headers: {
            'Content-Type': 'multipart/form-data; boundary=ipfs-lib',
            accept: 'application/json',
          },
          method: 'POST',
        },
      );

      expect(result).toEqual({
        error: null,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: param,
      });
    });

    test('authorization header', async () => {
      mockFetchJson.mockImplementation(async () => ({
        Name: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        Hash: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        Size: '48',
      }));

      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      const opts = { username: 'username', password: 'password' };
      const result = await ipfsService.add(
        param,
        'http://127.0.0.1:5001/api/v0/',
        opts,
      );
      const boundary = 'ipfs-lib';
      const payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${param}\r\n--${boundary}--`;

      const auth = Buffer.from(
        `${opts.username}:${opts.password}`,
        'binary',
      ).toString('base64');

      expect(mockFetchJson).toBeCalledTimes(1);
      expect(mockFetchJson).toBeCalledWith(
        'http://127.0.0.1:5001/api/v0/add?pin=true',
        {
          body: payload,
          headers: {
            'Content-Type': 'multipart/form-data; boundary=ipfs-lib',
            accept: 'application/json',
            Authorization: `Basic ${auth}`,
          },
          method: 'POST',
        },
      );

      expect(result).toEqual({
        error: null,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: param,
      });
    });
  });

  describe('Get', () => {
    test('got expected result', async () => {
      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      mockFetchText.mockImplementation(async () => param);
      const cid = 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT';
      const result = await ipfsService.get(
        cid,
        'http://127.0.0.1:5001/api/v0/',
      );
      expect(mockFetchText).toBeCalledTimes(1);
      expect(mockFetchText).toBeCalledWith(
        `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
        {
          method: 'POST',
          headers: {},
        },
      );
      expect(result).toEqual({
        error: null,
        cid: cid,
        data: param,
      });
    });

    test('undefined username|password', async () => {
      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      mockFetchText.mockImplementation(async () => param);
      const cid = 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT';
      const opts: any = {};
      const result = await ipfsService.get(
        cid,
        'http://127.0.0.1:5001/api/v0/',
        opts,
      );
      expect(mockFetchText).toBeCalledTimes(1);
      expect(mockFetchText).toBeCalledWith(
        `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
        {
          method: 'POST',
          headers: {},
        },
      );
      expect(result).toEqual({
        error: null,
        cid: cid,
        data: param,
      });
    });

    test('no opts', async () => {
      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      mockFetchText.mockImplementation(async () => param);
      const cid = 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT';
      const result = await ipfsService.get(
        cid,
        'http://127.0.0.1:5001/api/v0/',
      );
      expect(mockFetchText).toBeCalledTimes(1);
      expect(mockFetchText).toBeCalledWith(
        `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
        {
          method: 'POST',
          headers: {},
        },
      );
      expect(result).toEqual({
        error: null,
        cid: cid,
        data: param,
      });
    });

    test('authorization header', async () => {
      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      mockFetchText.mockImplementation(async () => param);
      const cid = 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT';
      const opts = { username: 'username', password: 'password' };
      const result = await ipfsService.get(
        cid,
        'http://127.0.0.1:5001/api/v0/',
        opts,
      );
      const auth = Buffer.from(
        `${opts.username}:${opts.password}`,
        'binary',
      ).toString('base64');

      expect(mockFetchText).toBeCalledTimes(1);
      expect(mockFetchText).toBeCalledWith(
        `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
        {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}` },
        },
      );
      expect(result).toEqual({
        error: null,
        cid: cid,
        data: param,
      });
    });

    test('fetchJson throw exception', async () => {
      mockFetchText.mockImplementation(() => {
        throw new HttpException('some exception', 404);
      });
      const cid = 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT';
      const result = await ipfsService.get(
        cid,
        'http://127.0.0.1:5001/api/v0/',
      );
      expect(mockFetchText).toBeCalledTimes(1);
      expect(mockFetchText).toBeCalledWith(
        `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
        {
          method: 'POST',
          headers: {},
        },
      );
      expect(result).toEqual({
        data: null,
        cid: null,
        error: 'Error during fetch, error: some exception',
      });
    });
  });
});
