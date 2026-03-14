/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BigNumber } from '@ethersproject/bignumber';
import { currentWC } from './fixtures/keys';
import { withTimer } from '@lido-nestjs/utils';
import {
  bufferFromHexString,
  WithdrawalCredentialsExtractorInterface,
  WithdrawalCredentialsFetcher,
} from '../src';
import { Lido, StakingRouter } from '@lido-nestjs/contracts';
import { CHAINS } from '@lido-nestjs/constants';

// bytes32 of "curated-onchain-v1"
const CURATED_ONCHAIN_V1_TYPE =
  '0x637572617465642d6f6e636861696e2d76310000000000000000000000000000';

// Must be at top level for jest hoisting
jest.mock('@lido-nestjs/contracts', () => {
  const actual = jest.requireActual('@lido-nestjs/contracts');
  return {
    ...actual,
    IStakingModule__factory: {
      connect: () => ({
        getType: async () => CURATED_ONCHAIN_V1_TYPE,
      }),
    },
  };
});

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('WC Extractor', () => {
  jest.setTimeout(30000);

  let wcExtractor!: WithdrawalCredentialsExtractorInterface;
  let getLidoContractWC!: jest.SpyInstance;
  let getNetwork!: jest.SpyInstance;

  beforeEach(() => {
    const stakingRouterMock: StakingRouter = <StakingRouter>(<any>{
      getStakingModuleWithdrawalCredentials: async () => {
        await sleep(1000);
        return currentWC;
      },
      getStakingModule: async () => {
        return {
          stakingModuleAddress: '0x0000000000000000000000000000000000000001',
        };
      },
      getContractVersion: async () => {
        return BigNumber.from(3);
      },
      provider: {
        getNetwork: async () => {
          await sleep(1000);
          return { chainId: CHAINS.Mainnet, name: '' };
        },
      },
    });

    const lidoContractMock: Lido = <Lido>(<any>{
      getWithdrawalCredentials: async () => {
        await sleep(1000);

        return currentWC;
      },
    });

    getLidoContractWC = jest.spyOn(
      lidoContractMock,
      'getWithdrawalCredentials',
    );
    getNetwork = jest.spyOn(stakingRouterMock.provider, 'getNetwork');

    wcExtractor = new WithdrawalCredentialsFetcher(
      lidoContractMock,
      stakingRouterMock,
    );
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
    expect(getLidoContractWC).toBeCalledTimes(1);
  });
});
