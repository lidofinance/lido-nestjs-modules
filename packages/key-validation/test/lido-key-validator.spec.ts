/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CHAINS } from '@lido-nestjs/constants';
import { LidoContractModule } from '@lido-nestjs/contracts';
import {
  currentWC,
  invalidUnusedKey,
  invalidUsedKey,
  invalidUsedKeyBadSignature,
  validUnusedKeyCurrentWC,
  validUsedKey,
  validUsedKeyCurrentWC,
} from './fixtures/keys';
import { range, withTimer } from '@lido-nestjs/utils';
import {
  Key,
  LidoKey,
  LidoKeyValidatorInterface,
  LidoKeyValidatorModule,
} from '../src';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { usedValidKeys } from './fixtures/used-valid-keys';
import { LIDO_CONTRACT_TOKEN } from '@lido-nestjs/contracts';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('LidoKeyValidator', () => {
  jest.setTimeout(60000);

  const getLidoKeyValidator = async (
    multithreaded: boolean,
    chain: CHAINS = CHAINS.Mainnet,
  ): Promise<LidoKeyValidatorInterface> => {
    const module: ModuleMetadata = {
      imports: [
        LidoContractModule.forRoot(),
        LidoKeyValidatorModule.forFeature({ multithreaded }),
      ],
    };
    const moduleRef = await Test.createTestingModule(module)
      .overrideProvider(LIDO_CONTRACT_TOKEN)
      .useValue({
        getWithdrawalCredentials: async () => {
          // this is needed because WC are cached
          await sleep(10);
          return currentWC;
        },
        provider: {
          getNetwork: async () => {
            // this is needed because WC are cached
            await sleep(100);
            return { chainId: chain, name: '' };
          },
        },
      })
      .compile();

    return moduleRef.get(LidoKeyValidatorInterface);
  };

  test('[single-thread] should validate empty array immediately', async () => {
    const keyValidator = await getLidoKeyValidator(false);

    const [res, time] = await withTimer(() => keyValidator.validateKeys([]));

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('[multi-thread] should validate empty array immediately', async () => {
    const keyValidator = await getLidoKeyValidator(true);

    const [res, time] = await withTimer(() => keyValidator.validateKeys([]));

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('[single-thread] should validate one valid used key', async () => {
    const keyValidator = await getLidoKeyValidator(false);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(validUsedKey),
    );

    expect(res[0].key).toBe(validUsedKey.key);
    expect(res[0].depositSignature).toBe(validUsedKey.depositSignature);
    expect(res[0].used).toBe(validUsedKey.used);
    expect(res[1]).toBe(true);
    expect(time).toBeLessThan(5);
  });

  test('[multi-thread] should validate one valid used key', async () => {
    const keyValidator = await getLidoKeyValidator(false);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(validUsedKey),
    );

    expect(res[0].key).toBe(validUsedKey.key);
    expect(res[0].depositSignature).toBe(validUsedKey.depositSignature);
    expect(res[0].used).toBe(validUsedKey.used);
    expect(res[1]).toBe(true);
    expect(time).toBeLessThan(5);
  });

  test('[single-thread] should validate one valid unused key', async () => {
    const keyValidator = await getLidoKeyValidator(false);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(validUnusedKeyCurrentWC),
    );

    expect(res[0].key).toBe(validUnusedKeyCurrentWC.key);
    expect(res[0].depositSignature).toBe(
      validUnusedKeyCurrentWC.depositSignature,
    );
    expect(res[0].used).toBe(validUnusedKeyCurrentWC.used);
    expect(res[1]).toBe(true);
    expect(time).toBeLessThan(5);
  });

  test('[multi-thread] should validate one valid unused key', async () => {
    const keyValidator = await getLidoKeyValidator(true);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(validUnusedKeyCurrentWC),
    );

    expect(res[0].key).toBe(validUnusedKeyCurrentWC.key);
    expect(res[0].depositSignature).toBe(
      validUnusedKeyCurrentWC.depositSignature,
    );
    expect(res[0].used).toBe(validUnusedKeyCurrentWC.used);
    expect(res[1]).toBe(true);
    expect(time).toBeLessThan(5);
  });

  test('[multi-thread] should validate one multiple used/unused keys', async () => {
    const keyValidator = await getLidoKeyValidator(true);

    const containsKey = (
      results: [Key & LidoKey, boolean][],
      lidoKey: LidoKey,
    ): boolean =>
      results
        .map((x) => x[0])
        .some(
          (x) =>
            x.key === lidoKey.key &&
            x.depositSignature == lidoKey.depositSignature &&
            x.used == lidoKey.used,
        );

    const keys = [
      validUnusedKeyCurrentWC,
      validUsedKeyCurrentWC,
      invalidUnusedKey,
      invalidUsedKey,
      validUsedKey,
    ];

    const [res, time] = await withTimer(() => keyValidator.validateKeys(keys));

    const validKeys = res.filter((x) => x[1]);
    const invalidKeys = res.filter((x) => !x[1]);

    expect(res.length).toBe(5);
    expect(validKeys.length).toBe(3);
    expect(invalidKeys.length).toBe(2);

    expect(containsKey(validKeys, validUnusedKeyCurrentWC)).toBe(true);
    expect(containsKey(validKeys, validUsedKeyCurrentWC)).toBe(true);
    expect(containsKey(validKeys, validUsedKey)).toBe(true);

    expect(containsKey(validKeys, invalidUsedKeyBadSignature)).toBe(false);

    expect(containsKey(invalidKeys, invalidUnusedKey)).toBe(true);
    expect(containsKey(invalidKeys, invalidUsedKey)).toBe(true);

    expect(containsKey(invalidKeys, invalidUsedKeyBadSignature)).toBe(false);

    expect(time).toBeLessThan(5);
  });

  test('[single-thread] should throw error for unsupported chain', async () => {
    const keyValidator = await getLidoKeyValidator(false, 38292);

    await expect(
      async () => await keyValidator.validateKeys([validUsedKey]),
    ).rejects.toThrow(`GENESIS_FORK_VERSION is undefined for chain 38292`);
  });

  test('[multi-thread] should throw error for unsupported chain', async () => {
    const keyValidator = await getLidoKeyValidator(true, 38292);

    await expect(
      async () => await keyValidator.validateKeys([validUsedKey]),
    ).rejects.toThrow(`GENESIS_FORK_VERSION is undefined for chain 38292`);
  });

  test('[single-thread] should work with valid keys', async () => {
    const keyValidator = await getLidoKeyValidator(false);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(usedValidKeys),
    );

    expect(results.length).toBe(100);

    // all keys are valid
    expect(results.every((x) => x[1])).toBe(true);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('[multi-thread] should work with valid keys', async () => {
    const keyValidator = await getLidoKeyValidator(true);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(usedValidKeys),
    );

    expect(results.length).toBe(100);

    // all keys are valid
    expect(results.every((x) => x[1])).toBe(true);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('[single-thread] should work with valid keys with custom properties', async () => {
    const usedValidKeysWithCustomProps = usedValidKeys.map((key, i) => ({
      ...key,
      custom: i * 2,
    }));

    const keyValidator = await getLidoKeyValidator(false);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(usedValidKeysWithCustomProps),
    );

    expect(results.length).toBe(100);

    // all keys are valid
    expect(results.every((x) => x[1])).toBe(true);
    expect(results.every((x, i) => x[0].custom === i * 2)).toBe(true);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('[multi-thread] should work with valid keys with custom properties', async () => {
    const usedValidKeysWithCustomProps = usedValidKeys.map((key, i) => ({
      ...key,
      custom: i * 2,
    }));

    const keyValidator = await getLidoKeyValidator(true);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(usedValidKeysWithCustomProps),
    );

    expect(results.length).toBe(100);

    // all keys are valid
    expect(results.every((x) => x[1])).toBe(true);
    expect(results.every((x, i) => x[0].custom === i * 2)).toBe(true);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should return false on invalid key', async () => {
    const keyValidator = await getLidoKeyValidator(false);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([invalidUsedKey]),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0].key).toBe(invalidUsedKey.key);
    expect(results[0][1]).toBe(false);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should return true on valid key', async () => {
    const keyValidator = await getLidoKeyValidator(false);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([validUsedKey]),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0].key).toBe(validUsedKey.key);
    expect(results[0][1]).toBe(true);
    expect(time).toBeLessThan(3); // 2 seconds
  });

  test('[multi-thread] should benchmark 1k keys', async () => {
    const keyValidator = await getLidoKeyValidator(true);
    const keys = range(0, 10)
      .map(() => usedValidKeys)
      .flat(1);

    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(keys),
    );

    expect(results.length).toBe(1000);
    expect(time).toBeLessThan(60); // 60 seconds
  });
});
