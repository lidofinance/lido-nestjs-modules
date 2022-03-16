import { Test } from '@nestjs/testing';
import {
  LidoContractModule,
  RegistryContractModule,
  Registry__factory,
} from '@lido-nestjs/contracts';
import { getNetwork } from '@ethersproject/networks';
import { Interface } from '@ethersproject/abi';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcBatchProvider } from '@ethersproject/providers';
import { unbufferedLog } from '../fixtures/unbuffered.fixture';
import { RegistryFetchModule, RegistryMetaFetchService } from '../../src';

describe('Meta', () => {
  const provider = new JsonRpcBatchProvider(process.env.EL_RPC_URL);
  let fetchService: RegistryMetaFetchService;

  const mockCall = jest
    .spyOn(provider, 'call')
    .mockImplementation(async () => '');

  const mockSend = jest
    .spyOn(provider, 'send')
    .mockImplementation(async () => []);

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  beforeEach(async () => {
    const imports = [
      LidoContractModule.forRoot({ provider }),
      RegistryContractModule.forRoot({ provider }),
      RegistryFetchModule.forFeature(),
    ];
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    fetchService = moduleRef.get(RegistryMetaFetchService);
  });

  afterEach(async () => {
    mockCall.mockReset();
    mockSend.mockReset();
  });

  test('fetchKeysOpIndex', async () => {
    const expected = 10;

    mockCall.mockImplementation(async () => {
      const iface = new Interface(Registry__factory.abi);
      return iface.encodeFunctionResult('getKeysOpIndex', [expected]);
    });
    const result = await fetchService.fetchKeysOpIndex();

    expect(result).toEqual(expected);
    expect(mockCall).toBeCalledTimes(1);
  });

  test('fetchUnbufferedLogs', async () => {
    mockSend.mockImplementation(async () => [unbufferedLog]);
    const result = await fetchService.fetchUnbufferedLogs(100, 110);

    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith('eth_getLogs', [
      expect.objectContaining({
        address: expect.any(String),
        fromBlock: expect.any(String),
        toBlock: expect.any(String),
        topics: [expect.any(String)],
      }),
    ]);
    expect(result).toEqual([
      expect.objectContaining({
        ...unbufferedLog,
        event: 'Unbuffered',
        eventSignature: 'Unbuffered(uint256)',
        args: expect.arrayContaining([BigNumber.from(unbufferedLog.data)]),
        decode: expect.any(Function),
        getBlock: expect.any(Function),
        getTransaction: expect.any(Function),
        getTransactionReceipt: expect.any(Function),
        removeListener: expect.any(Function),
      }),
    ]);
  });

  describe('fetchLastUnbufferedLog', () => {
    test('Basic', async () => {
      mockSend.mockImplementation(async () => [unbufferedLog]);
      const result = await fetchService.fetchLastUnbufferedLog(100);

      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith('eth_getLogs', [
        expect.objectContaining({
          address: expect.any(String),
          fromBlock: expect.any(String),
          toBlock: expect.any(String),
          topics: [expect.any(String)],
        }),
      ]);
      expect(result).toEqual(
        expect.objectContaining({
          ...unbufferedLog,
          event: 'Unbuffered',
          eventSignature: 'Unbuffered(uint256)',
          args: expect.arrayContaining([BigNumber.from(unbufferedLog.data)]),
          decode: expect.any(Function),
          getBlock: expect.any(Function),
          getTransaction: expect.any(Function),
          getTransactionReceipt: expect.any(Function),
          removeListener: expect.any(Function),
        }),
      );
    });

    test('Get previous batch', async () => {
      mockSend
        .mockImplementationOnce(async () => [])
        .mockImplementationOnce(async () => [unbufferedLog]);

      await fetchService.fetchLastUnbufferedLog(100, 10);

      expect(mockSend).toBeCalledTimes(2);

      const calls = mockSend.mock.calls;
      expect(calls[0][1]).toEqual([
        expect.objectContaining({
          fromBlock: BigNumber.from(91).toHexString(),
          toBlock: BigNumber.from(100).toHexString(),
        }),
      ]);
      expect(calls[1][1]).toEqual([
        expect.objectContaining({
          fromBlock: BigNumber.from(81).toHexString(),
          toBlock: BigNumber.from(90).toHexString(),
        }),
      ]);
    });

    test('Wrong block', async () => {
      await expect(fetchService.fetchLastUnbufferedLog(0)).rejects.toThrow();
      await expect(fetchService.fetchLastUnbufferedLog(-1)).rejects.toThrow();
    });

    test('Wrong step', async () => {
      await expect(
        fetchService.fetchLastUnbufferedLog(10, 0),
      ).rejects.toThrow();

      await expect(
        fetchService.fetchLastUnbufferedLog(10, -1),
      ).rejects.toThrow();
    });
  });
});
