/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CHAINS } from '@lido-nestjs/constants';
import { LidoKeyValidator } from '../src';
import { Lido } from '@lido-nestjs/contracts';
import {
  currentWC,
  invalidUsedKey,
  usedValidKeys as batchUsedKeys100,
  validUsedKey,
} from './keys';
import { range, withTimer } from '@lido-nestjs/utils';
import {
  GenesisForkVersionService,
  KeyValidator,
  SingleThreadedKeyValidatorExecutor,
  WithdrawalCredentialsFetcher,
} from '../src/services';

describe('LidoKeyValidator', () => {
  const getLidoContract = async () => {
    const contract = {
      getWithdrawalCredentials: async () => currentWC,

      get provider() {
        return {
          getNetwork: async () => ({ chainId: CHAINS.Mainnet }),
        }
      }
    };

    return <Lido>(<any>contract);
  };

  const getKeyValidator = async () => {
    const lido = await getLidoContract();
    const wcFetcher = new WithdrawalCredentialsFetcher(lido);
    const executor = new SingleThreadedKeyValidatorExecutor();
    const gfv = new GenesisForkVersionService();
    const validator = new KeyValidator(executor);

    return new LidoKeyValidator(validator, wcFetcher, gfv);
  }

  test('should validate empty array immediately', async () => {
    const keyValidator = await getKeyValidator();

    const [res, time] = await withTimer(() =>
      keyValidator.validateKeys([]),
    );

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('should validate one valid used key', async () => {
    const lido: Lido = await getLidoContract();
    const keyValidator = await getKeyValidator();

    // WC cache warm up
    await keyValidator.validateKey(validUsedKey);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(validUsedKey),
    );

    expect(res[0]).toBe(validUsedKey.key);
    expect(res[1]).toBe(true);
    expect(time).toBeLessThan(0.2);
  });

  test('should throw error for unsupported chain', async () => {
    const keyValidator = await getKeyValidator();

    // TODO

    await expect(
      async () => await keyValidator.validateKeys([validUsedKey]),
    ).rejects.toThrow(
      `Genesis fork version is undefined for chain [400]. See GENESIS_FORK_VERSION constant`,
    );
  });

  test('should work with valid keys', async () => {
    const keyValidator = await getKeyValidator();
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(batchUsedKeys100),
    );

    expect(results.length).toBe(100);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should return false on invalid key', async () => {
    const keyValidator = await getKeyValidator();
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([invalidUsedKey]),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0]).toBe(invalidUsedKey.key);
    expect(results[0][1]).toBe(false);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should return true on valid key', async () => {
    const keyValidator = await getKeyValidator();
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([validUsedKey]),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0]).toBe(validUsedKey.key);
    expect(results[0][1]).toBe(true);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should benchmark 10k keys', async () => {
    const keyValidator = await getKeyValidator();
    const keys = range(0, 100)
      .map(() => batchUsedKeys100)
      .flat(1);

    // WC cache warm up
    await keyValidator.validateKeys([keys[0]]);

    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(keys),
    );

    expect(results.length).toBe(10000);
    expect(time).toBeLessThan(60); // 60 seconds
  });
});
