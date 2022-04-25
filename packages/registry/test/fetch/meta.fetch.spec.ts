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

  describe('Keys op index', () => {
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
  });

  describe('Unbuffered logs', () => {
    test('fetchLastUnbufferedLog', async () => {
      const blockNumber = 100;
      const blockHash =
        '0x0000000000000000000000000000000000000000000000000000000000000001';

      mockSend.mockImplementation(async () => [unbufferedLog]);
      const result = await fetchService.fetchLastUnbufferedLog({
        number: blockNumber,
        hash: blockHash,
      });

      expect(mockSend).toBeCalledTimes(2);

      const calls = mockSend.mock.calls;
      expect(calls[0][1]).toEqual([expect.objectContaining({ blockHash })]);
      expect(calls[1][1]).toEqual([
        expect.objectContaining({
          fromBlock: '0x0',
          toBlock: BigNumber.from(blockNumber).toHexString(),
        }),
      ]);

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

    test('fetchLastUnbufferedLog - no logs', async () => {
      jest
        .spyOn(fetchService, 'fetchUnbufferedLogsInBlock')
        .mockImplementation(async () => []);

      jest
        .spyOn(fetchService, 'fetchUnbufferedLogsInHistory')
        .mockImplementation(async () => []);

      await expect(
        fetchService.fetchLastUnbufferedLog({
          number: 0,
          hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
        }),
      ).rejects.toThrow();
    });

    test('fetchUnbufferedLogsInHistory', async () => {
      mockSend.mockImplementation(async () => [unbufferedLog]);
      const result = await fetchService.fetchUnbufferedLogsInHistory(100);

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

    test('fetchUnbufferedLogsInHistory - get previous batch', async () => {
      mockSend
        .mockImplementationOnce(async () => [])
        .mockImplementationOnce(async () => [unbufferedLog]);

      await fetchService.fetchUnbufferedLogsInHistory(100, 10);

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

    test('fetchUnbufferedLogsInHistory - wrong block', async () => {
      await expect(
        fetchService.fetchUnbufferedLogsInHistory(0),
      ).rejects.toThrow();

      await expect(
        fetchService.fetchUnbufferedLogsInHistory(-1),
      ).rejects.toThrow();
    });

    test('fetchUnbufferedLogsInHistory - wrong step', async () => {
      await expect(
        fetchService.fetchUnbufferedLogsInHistory(10, 0),
      ).rejects.toThrow();

      await expect(
        fetchService.fetchUnbufferedLogsInHistory(10, -1),
      ).rejects.toThrow();
    });

    test('fetchUnbufferedLogsInRange', async () => {
      mockSend.mockImplementation(async () => [unbufferedLog]);
      const result = await fetchService.fetchUnbufferedLogsInRange(100, 110);

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
  });
});
