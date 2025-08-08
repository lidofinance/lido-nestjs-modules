/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import { FetchModule } from '@lido-nestjs/fetch';
import { IpfsNopKeysService, IpfsNopKeysModule } from '../../src';
import { IpfsGeneralService, IpfsModule } from '@lido-nestjs/ipfs-http-client';

describe('Ipfs service', () => {
  let ipfsService: IpfsNopKeysService;
  let ipfsGeneralService: IpfsGeneralService;

  let mockAdd: any;
  let mockGet: any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        FetchModule.forRoot(),
        IpfsModule.forRoot({
          imports: [FetchModule],
          url: '',
          username: '',
          password: '',
        }),
        IpfsNopKeysModule.forRoot({}),
      ],
    }).compile();

    ipfsService = moduleRef.get(IpfsNopKeysService);
    ipfsGeneralService = moduleRef.get(IpfsGeneralService);

    mockAdd = jest.spyOn(ipfsGeneralService, 'add');
    mockGet = jest.spyOn(ipfsGeneralService, 'get');
  });

  test('Methods are defined', () => {
    expect(ipfsService.addKeySign).toBeDefined();
    expect(ipfsService.getKeySign).toBeDefined();

    expect(ipfsGeneralService.add).toBeDefined();
    expect(ipfsGeneralService.get).toBeDefined();
  });

  describe('Params validation', () => {
    test('absence of sign', async () => {
      const params: any = [{ key: 'key1', sign: 'sign1' }, { key: 'key1' }];

      await expect(ipfsService.addKeySign(params)).rejects.toThrowError(
        'Incorrect parameter, values should be KeySignPair[]',
      );
    });

    test('wrong type', async () => {
      const params: any = [
        { key: 'key1', sign: 4 },
        { key: 'key1', sign: 'sign1' },
      ];

      await expect(ipfsService.addKeySign(params)).rejects.toThrowError(
        'Incorrect parameter, values should be KeySignPair[]',
      );
    });

    test('parameter is not list', async () => {
      const params: any = { key: 'key1', sign: 'sign1' };

      await expect(ipfsService.addKeySign(params)).rejects.toThrowError(
        'Incorrect parameter, values should be KeySignPair[]',
      );
    });
  });

  describe('addKeySign', () => {
    test('got error message', async () => {
      const error = 'some error message';

      mockAdd = mockAdd.mockImplementation(() => {
        throw new Error(error);
      });

      const param = [
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ];

      await expect(ipfsService.addKeySign(param)).rejects.toThrowError(error);

      expect(mockAdd).toBeCalledTimes(1);
      expect(mockAdd).toBeCalledWith(JSON.stringify(param));
    });

    test('successful result', async () => {
      const param = [
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ];

      mockAdd = mockAdd.mockImplementation(async () => ({
        data: JSON.stringify(param),
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      }));

      const result = await ipfsService.addKeySign(param);

      expect(mockAdd).toBeCalledTimes(1);
      expect(mockAdd).toBeCalledWith(JSON.stringify(param));

      expect(result).toEqual({
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: param,
      });
    });
  });

  describe('getKeySign', () => {
    test('get wrong json', async () => {
      const unexpectedResult = 'key:value';
      mockGet = mockGet.mockImplementation(async () => ({
        data: unexpectedResult,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      }));

      // Json.parse throw error
      await expect(
        ipfsService.getKeySign(
          'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        ),
      ).rejects.toThrowError(
        'Unexpected token \'k\', "key:value" is not valid JSON',
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      );
    });

    test('result is not keySignPair[]', async () => {
      const unexpectedResult = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1' },
      ]);
      mockGet = mockGet.mockImplementation(async () => ({
        data: unexpectedResult,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      }));

      await expect(
        ipfsService.getKeySign(
          'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        ),
      ).rejects.toThrowError(
        'Incorrect parameter, values should be KeySignPair[]',
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      );
    });

    test('successfull result', async () => {
      const param = JSON.stringify([
        { key: 'key1', sign: 'sign1' },
        { key: 'key1', sign: 'sign1' },
      ]);

      mockGet = mockGet.mockImplementation(async () => ({
        data: param,
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      }));

      const result = await ipfsService.getKeySign(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      );

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      );

      expect(result).toEqual({
        cid: 'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        data: JSON.parse(param),
      });
    });

    test('got error message', async () => {
      const error = 'some error message';

      mockGet = mockGet.mockImplementation(async () => {
        throw new Error(error);
      });

      await expect(
        ipfsService.getKeySign(
          'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
        ),
      ).rejects.toThrowError(error);

      expect(mockGet).toBeCalledTimes(1);
      expect(mockGet).toBeCalledWith(
        'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      );
    });
  });
});
