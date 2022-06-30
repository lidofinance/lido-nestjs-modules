/* eslint-disable @typescript-eslint/no-var-requires */
import { CHAINS } from '@lido-nestjs/constants';
import { LidoKeyValidator } from '../src';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Test } from '@nestjs/testing';
import { Lido, LidoContractModule } from '@lido-nestjs/contracts';
import {
  invalidUsedKey,
  usedValidKeys as batchUsedKeys100,
  validUsedKey,
} from './keys';

describe('LidoKeyValidator', () => {
  function* positiveIterator(start: number, end: number) {
    for (let i = start; i < end; i++) yield i;
  }

  function* negativeIterator(start: number, end: number) {
    for (let i = start; i > end; i--) yield i;
  }

  const range = (start: number, end: number) => {
    const delta = start - end;
    const iterator = delta < 0 ? positiveIterator : negativeIterator;

    return [...iterator(start, end)];
  };

  const withTimer = async <T>(
    callback: () => Promise<T>,
  ): Promise<[T, number]> => {
    const timeStartMs = performance.now();
    const result = await callback();
    const timeEndMs = performance.now();
    const timeSeconds = Math.ceil(timeEndMs - timeStartMs) / 1000;

    return [result, timeSeconds];
  };

  const chainId: CHAINS = CHAINS.Mainnet;

  const getContract = async (
    Module: typeof LidoContractModule,
    token: symbol,
  ) => {
    const provider = new JsonRpcProvider(process.env.EL_RPC_URL);

    const moduleRef = await Test.createTestingModule({
      imports: [Module.forRoot({ provider })],
    }).compile();

    return moduleRef.get(token);
  };

  test('should validate empty array', async () => {
    const lido: Lido = await getContract(
      LidoContractModule,
      LidoContractModule.contractToken,
    );
    const keyValidator = new LidoKeyValidator(lido);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKeys([], chainId),
    );

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('should validate one valid used key', async () => {
    const lido: Lido = await getContract(
      LidoContractModule,
      LidoContractModule.contractToken,
    );
    const keyValidator = new LidoKeyValidator(lido);

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
    const lido: Lido = await getContract(
      LidoContractModule,
      LidoContractModule.contractToken,
    );
    const keyValidator = new LidoKeyValidator(lido);

    await expect(
      async () => await keyValidator.validateKeys([validUsedKey], 400),
    ).rejects.toThrow(
      `Genesis fork version is undefined for chain [400]. See key-validation/constants.ts`,
    );
  });

  test('should work with valid keys', async () => {
    const lido: Lido = await getContract(
      LidoContractModule,
      LidoContractModule.contractToken,
    );

    const keyValidator = new LidoKeyValidator(lido);
    const [results, time] = await withTimer(() =>
      keyValidator.validateKeys(batchUsedKeys100, chainId),
    );

    expect(results.length).toBe(100);
    expect(time).toBeLessThan(2); // 2 seconds
  });

  test('should return false on invalid key', async () => {
    const lido: Lido = await getContract(
      LidoContractModule,
      LidoContractModule.contractToken,
    );

    const keyValidator = new LidoKeyValidator(lido);
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
    const lido: Lido = await getContract(
      LidoContractModule,
      LidoContractModule.contractToken,
    );

    const keyValidator = new LidoKeyValidator(lido);
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
    const lido: Lido = await getContract(
      LidoContractModule,
      LidoContractModule.contractToken,
    );

    const keyValidator = new LidoKeyValidator(lido);
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
