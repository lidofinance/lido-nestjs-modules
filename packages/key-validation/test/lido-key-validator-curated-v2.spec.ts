/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BigNumber } from '@ethersproject/bignumber';
import { CHAINS } from '@lido-nestjs/constants';
import {
  LidoContractModule,
  LIDO_CONTRACT_TOKEN,
  StakingRouterContractModule,
  STAKING_ROUTER_CONTRACT_TOKEN,
} from '@lido-nestjs/contracts';
import {
  invalidUsedKeyCuratedV2,
  validUsedKeyCuratedV2,
} from './fixtures/keys';
import { withTimer } from '@lido-nestjs/utils';
import { LidoKeyValidatorInterface, LidoKeyValidatorModule } from '../src';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';

// bytes32 of "curated-onchain-v2"
const CURATED_ONCHAIN_V2_TYPE =
  '0x637572617465642d6f6e636861696e2d76320000000000000000000000000000';

const WC = '0x009690e5d4472c7c0dbdf490425d89862535d2a52fb686333f3a0a9ff5d2125e';

// Mock IStakingModule__factory before imports use it
jest.mock('@lido-nestjs/contracts', () => {
  const actual = jest.requireActual('@lido-nestjs/contracts');
  return {
    ...actual,
    IStakingModule__factory: {
      connect: () => ({
        getType: async () => CURATED_ONCHAIN_V2_TYPE,
      }),
    },
  };
});

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('LidoKeyValidator', () => {
  jest.setTimeout(60000);

  const getLidoKeyValidator = async (
    chain: CHAINS = CHAINS.Mainnet,
  ): Promise<LidoKeyValidatorInterface> => {
    const module: ModuleMetadata = {
      imports: [
        LidoContractModule.forRoot(),
        StakingRouterContractModule.forRoot(),
        LidoKeyValidatorModule.forFeature({ multithreaded: false }),
      ],
    };
    const moduleRef = await Test.createTestingModule(module)
      .overrideProvider(LIDO_CONTRACT_TOKEN)
      .useValue({
        getWithdrawalCredentials: async () => {
          await sleep(10);
          return WC;
        },
      })
      .overrideProvider(STAKING_ROUTER_CONTRACT_TOKEN)
      .useValue({
        getStakingModuleWithdrawalCredentials: async () => {
          await sleep(10);
          return WC;
        },
        getStakingModule: async () => {
          return {
            stakingModuleAddress: '0x0000000000000000000000000000000000000002',
          };
        },
        getContractVersion: async () => {
          return BigNumber.from(4);
        },
        provider: {
          getNetwork: async () => {
            await sleep(100);
            return { chainId: chain, name: '' };
          },
        },
      })
      .compile();

    return moduleRef.get(LidoKeyValidatorInterface);
  };

  test('should validate one valid key', async () => {
    const keyValidator = await getLidoKeyValidator();
    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(validUsedKeyCuratedV2),
    );

    expect(res[0].key).toBe(validUsedKeyCuratedV2.key);
    expect(res[0].depositSignature).toBe(
      validUsedKeyCuratedV2.depositSignature,
    );
    expect(res[0].used).toBe(validUsedKeyCuratedV2.used);
    expect(res[1]).toBe(true);
    expect(time).toBeLessThan(5);
  });

  test('should validate one invalid key', async () => {
    const keyValidator = await getLidoKeyValidator();
    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(invalidUsedKeyCuratedV2),
    );

    expect(res[0].key).toBe(invalidUsedKeyCuratedV2.key);
    expect(res[0].depositSignature).toBe(
      invalidUsedKeyCuratedV2.depositSignature,
    );
    expect(res[0].used).toBe(invalidUsedKeyCuratedV2.used);
    expect(res[1]).toBe(false);
    expect(time).toBeLessThan(5);
  });

  test('should return true on valid key', async () => {
    const keyValidator = await getLidoKeyValidator();
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([validUsedKeyCuratedV2]),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0].key).toBe(validUsedKeyCuratedV2.key);
    expect(results[0][1]).toBe(true);
    expect(time).toBeLessThan(3); // 2 seconds
  });

  test('should return false on invalid key', async () => {
    const keyValidator = await getLidoKeyValidator();
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([invalidUsedKeyCuratedV2]),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0].key).toBe(invalidUsedKeyCuratedV2.key);
    expect(results[0][1]).toBe(false);
    expect(time).toBeLessThan(2); // 2 seconds
  });
});
