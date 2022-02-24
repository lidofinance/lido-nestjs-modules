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
});
