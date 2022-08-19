/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import { FetchModule } from '@lido-nestjs/fetch';
import { IpfsNopKeysService } from '../../src';

describe('Ipfs service', () => {
  let ipfsService: IpfsNopKeysService;

  let mockAdd: any;
  let mockGet: any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FetchModule.forRoot()],
      providers: [IpfsNopKeysService],
    }).compile();
    ipfsService = moduleRef.get(IpfsNopKeysService);

    mockAdd = jest.spyOn(ipfsService, 'add');
    mockGet = jest.spyOn(ipfsService, 'get');
  });

  test('Methods are defined', () => {
    expect(ipfsService.add).toBeDefined();
    expect(ipfsService.get).toBeDefined();

    expect(ipfsService.addKeySign).toBeDefined();
    expect(ipfsService.getKeySign).toBeDefined();
  });

  describe('Params validation', () => {
    test('absence of sign', async () => {
      const params: any = [{ key: 'key1', sign: 'sign1' }, { key: 'key1' }];

      expect(
        await ipfsService.addKeySign(params, 'someurl', {
          username: 'username',
          password: 'password',
        }),
      ).toEqual({
        cid: null,
        data: null,
        error: 'Incorrect parameter, values should be KeySignPair[]',
      });
    });

    test('wrong type', async () => {
      const params: any = [
        { key: 'key1', sign: 4 },
        { key: 'key1', sign: 'sign1' },
      ];

      expect(
        await ipfsService.addKeySign(params, 'someurl', {
          username: 'username',
          password: 'password',
        }),
      ).toEqual({
        cid: null,
        data: null,
        error: 'Incorrect parameter, values should be KeySignPair[]',
      });
    });

    test('parameter is not list', async () => {
      const params: any = { key: 'key1', sign: 'sign1' };

      expect(
        await ipfsService.addKeySign(params, 'someurl', {
          username: 'username',
          password: 'password',
        }),
      ).toEqual({
        cid: null,
        data: null,
        error: 'Incorrect parameter, values should be KeySignPair[]',
      });
    });
  });

  describe('addKeySign', () => {
    test('got error message', async () => {
      const error = 'some error message';

      mockAdd = mockAdd.mockImplementation(async () => ({
        data: null,
        cid: null,
        error: error,
      }));

      const param = [
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ];

      const result = await ipfsService.addKeySign(
        param,
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(mockAdd).toBeCalledTimes(1);
      expect(mockAdd).toBeCalledWith(
        JSON.stringify(param),
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(result).toEqual({
        cid: null,
        data: null,
        error: error,
      });
    });

    test('successful result', async () => {
      const param = [
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ];

      mockAdd = mockAdd.mockImplementation(async () => ({
        data: JSON.stringify(param),
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        error: null,
      }));

      const result = await ipfsService.addKeySign(
        param,
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(mockAdd).toBeCalledTimes(1);
      expect(mockAdd).toBeCalledWith(
        JSON.stringify(param),
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(result).toEqual({
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: param,
        error: null,
      });
    });
  });

  describe('getKeySign', () => {
    test('get wrong json', async () => {
      const unexpectedResult = 'key:value';
      mockGet = mockGet.mockImplementation(async () => ({
        data: unexpectedResult,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        error: null,
      }));

      const result = await ipfsService.getKeySign(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(result).toEqual({
        cid: null,
        data: null,
        error: `Unexpected result: ${unexpectedResult}`,
      });
    });

    test('result is not keySignPair[]', async () => {
      const unexpectedResult = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1' },
      ]);
      mockGet = mockGet.mockImplementation(async () => ({
        data: unexpectedResult,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        error: null,
      }));

      const result = await ipfsService.getKeySign(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(result).toEqual({
        cid: null,
        data: null,
        error: `Unexpected result: ${unexpectedResult}`,
      });
    });

    test('successfull result', async () => {
      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);

      mockGet = mockGet.mockImplementation(async () => ({
        data: param,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        error: null,
      }));

      const result = await ipfsService.getKeySign(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(result).toEqual({
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: JSON.parse(param),
        error: null,
      });
    });

    test('got error message', async () => {
      const error = 'some error message';

      mockGet = mockGet.mockImplementation(async () => ({
        data: null,
        cid: null,
        error: error,
      }));

      const result = await ipfsService.getKeySign(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(result).toEqual({
        cid: null,
        data: null,
        error: error,
      });
    });

    test('got null data', async () => {
      mockGet = mockGet.mockImplementation(async () => ({
        data: null,
        cid: null,
        error: null,
      }));

      const result = await ipfsService.getKeySign(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        'http://127.0.0.1:5001/api/v0',
        { username: 'username', password: 'password' },
      );

      expect(result).toEqual({
        cid: null,
        data: null,
        error: 'Unexpected result: null',
      });
    });
  });
});
