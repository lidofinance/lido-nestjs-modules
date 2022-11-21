/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { IpfsGeneralService, IpfsModule } from '../../src';
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

  describe('username/password is not defined', () => {
    beforeEach(async () => {
      const module = {
        imports: [
          IpfsModule.forFeature({
            imports: [FetchModule],
            url: 'http://127.0.0.1:5001/api/v0',
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();

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
        expect(ipfsService.add(param)).rejects.toThrowError(
          'Unexpected result: "some other result"',
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
      });

      test('fetchJson throw exception', async () => {
        mockFetchJson.mockImplementation(() => {
          throw new HttpException('some exception', 404);
        });

        const param = JSON.stringify([
          { key: 'key1', sign: 'sign1' },
          { key: 'key1', sign: 'sign1' },
        ]);
        expect(ipfsService.add(param)).rejects.toThrowError('some exception');

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
        const result = await ipfsService.get(cid);
        expect(mockFetchText).toBeCalledTimes(1);
        expect(mockFetchText).toBeCalledWith(
          `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
          {
            method: 'POST',
            headers: {},
          },
        );
        expect(result).toEqual({
          cid: cid,
          data: param,
        });
      });

      test('fetchJson throw exception', async () => {
        mockFetchText.mockImplementation(() => {
          throw new HttpException('some exception', 404);
        });
        const cid = 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT';
        expect(ipfsService.get(cid)).rejects.toThrowError('some exception');
        expect(mockFetchText).toBeCalledTimes(1);
        expect(mockFetchText).toBeCalledWith(
          `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
          {
            method: 'POST',
            headers: {},
          },
        );
      });
    });
  });

  describe('authorization header', () => {
    beforeEach(async () => {
      const module = {
        imports: [
          IpfsModule.forFeature({
            imports: [FetchModule],
            url: 'http://127.0.0.1:5001/api/v0',
            username: 'username',
            password: 'password',
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();

      ipfsService = moduleRef.get(IpfsGeneralService);
      httpService = moduleRef.get(FetchService);

      mockFetchJson = jest.spyOn(httpService, 'fetchJson');
      mockFetchText = jest.spyOn(httpService, 'fetchText');
    });

    test('add', async () => {
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

      const auth = Buffer.from('username:password', 'binary').toString(
        'base64',
      );

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
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: param,
      });
    });

    test('get', async () => {
      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);
      mockFetchText.mockImplementation(async () => param);
      const cid = 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT';
      const result = await ipfsService.get(cid);
      const auth = Buffer.from('username:password', 'binary').toString(
        'base64',
      );

      expect(mockFetchText).toBeCalledTimes(1);
      expect(mockFetchText).toBeCalledWith(
        `http://127.0.0.1:5001/api/v0/cat?arg=${cid}`,
        {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}` },
        },
      );
      expect(result).toEqual({
        cid: cid,
        data: param,
      });
    });
  });
});
