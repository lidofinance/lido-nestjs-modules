/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { currentWC } from './fixtures/keys';
import { withTimer } from '@lido-nestjs/utils';
import {
  bufferFromHexString,
  WithdrawalCredentialsExtractorInterface,
  WithdrawalCredentialsFetcher,
} from '../src';
import { Lido } from '@lido-nestjs/contracts';
import { CHAINS } from '@lido-nestjs/constants';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('WC Extractor', () => {
  jest.setTimeout(30000);

  let wcExtractor!: WithdrawalCredentialsExtractorInterface;
  let getWC!: jest.SpyInstance;
  let getNetwork!: jest.SpyInstance;

  beforeEach(() => {
    const lidoContractMock: Lido = <Lido>(<any>{
      getWithdrawalCredentials: async () => {
        await sleep(1000);

        return currentWC;
      },
      provider: {
        getNetwork: async () => {
          await sleep(1000);
          return { chainId: CHAINS.Mainnet, name: '' };
        },
      },
    });

    getWC = jest.spyOn(lidoContractMock, 'getWithdrawalCredentials');
    getNetwork = jest.spyOn(lidoContractMock.provider, 'getNetwork');

    wcExtractor = new WithdrawalCredentialsFetcher(lidoContractMock);
  });

  test('should return getChainId', async () => {
    const chainId = await wcExtractor.getChainId();

    expect(chainId).toBe(CHAINS.Mainnet);
  });

  test('should return WC', async () => {
    const wc = await wcExtractor.getWithdrawalCredentials();

    expect(wc).toBe(currentWC);
  });

  test('should return possible WC', async () => {
    const possibleWC = await wcExtractor.getPossibleWithdrawalCredentials();

    expect(possibleWC).toHaveProperty('currentWC');
    expect(possibleWC).toHaveProperty('previousWC');

    expect(possibleWC.currentWC).toStrictEqual([
      currentWC,
      bufferFromHexString(currentWC),
    ]);
  });

  test('should debounce getChainId', async () => {
    const [chainIds, time] = await withTimer(() =>
      Promise.all([wcExtractor.getChainId(), wcExtractor.getChainId()]),
    );

    expect(chainIds[0]).toBe(CHAINS.Mainnet);
    expect(chainIds[1]).toBe(CHAINS.Mainnet);
    expect(time).toBeLessThan(1100);
    expect(getNetwork).toBeCalledTimes(1);
  });

  test('should debounce getWithdrawalCredentials', async () => {
    const [wcs, time] = await withTimer(() =>
      Promise.all([
        wcExtractor.getWithdrawalCredentials(),
        wcExtractor.getWithdrawalCredentials(),
      ]),
    );

    expect(wcs[0]).toBe(currentWC);
    expect(wcs[1]).toBe(currentWC);
    expect(time).toBeLessThan(1100);
    expect(getWC).toBeCalledTimes(1);
  });
});
