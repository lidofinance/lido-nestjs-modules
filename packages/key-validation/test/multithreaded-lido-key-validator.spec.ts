/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CHAINS } from '@lido-nestjs/constants';
import { MultithreadedLidoKeyValidator } from '../src';
import { Lido } from '@lido-nestjs/contracts';
import {
  currentWC,
  invalidUsedKey,
  usedValidKeys as batchUsedKeys100,
  validUsedKey,
} from './keys';
import { range, withTimer } from './utils';

describe('MultithreadedLidoKeyValidator', () => {
  jest.setTimeout(30000);

  const chainId: CHAINS = CHAINS.Mainnet;

  const getLidoContract = async () => {
    const contract = {
      getWithdrawalCredentials: async () => currentWC,
    };

    return <Lido>(<any>contract);
  };

  test('should validate empty array immediately', async () => {
    const lido: Lido = await getLidoContract();
    const keyValidator = new MultithreadedLidoKeyValidator(lido);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKeys([], chainId),
    );

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('should validate one valid used key', async () => {
    const lido: Lido = await getLidoContract();
    const keyValidator = new MultithreadedLidoKeyValidator(lido);

    // WC cache warm up
    await keyValidator.validateKey(validUsedKey, chainId);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKey(validUsedKey, chainId),
    );

    expect(res[0]).toBe(validUsedKey.key);
    expect(res[1]).toBe(true);
    expect(time).toBeLessThan(0.2);
  });

  test('should throw error for unsupported chain', async () => {
    const lido: Lido = await getLidoContract();
    const keyValidator = new MultithreadedLidoKeyValidator(lido);

    await expect(
      async () => await keyValidator.validateKeys([validUsedKey], 400),
    ).rejects.toThrow(
      `Genesis fork version is undefined for chain [400]. See GENESIS_FORK_VERSION constant`,
    );
  });

  test('should work with valid keys', async () => {
    const lido: Lido = await getLidoContract();

    const keyValidator = new MultithreadedLidoKeyValidator(lido);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(batchUsedKeys100, chainId),
    );

    expect(results.length).toBe(100);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should return false on invalid key', async () => {
    const lido: Lido = await getLidoContract();

    const keyValidator = new MultithreadedLidoKeyValidator(lido);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([invalidUsedKey], chainId),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0]).toBe(invalidUsedKey.key);
    expect(results[0][1]).toBe(false);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should return true on valid key', async () => {
    const lido: Lido = await getLidoContract();

    const keyValidator = new MultithreadedLidoKeyValidator(lido);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys([validUsedKey], chainId),
    );

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0]).toBe(validUsedKey.key);
    expect(results[0][1]).toBe(true);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should benchmark 10k keys', async () => {
    const lido: Lido = await getLidoContract();

    const keyValidator = new MultithreadedLidoKeyValidator(lido);
    const keys = range(0, 100)
      .map(() => batchUsedKeys100)
      .flat(1);

    // WC cache warm up
    await keyValidator.validateKeys([keys[0]], chainId);

    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(keys, chainId),
    );

    expect(results.length).toBe(10000);
    expect(time).toBeLessThan(30); // 30 seconds
  });
});
