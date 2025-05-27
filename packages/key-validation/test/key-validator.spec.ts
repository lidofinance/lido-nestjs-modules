/* eslint-disable @typescript-eslint/no-var-requires */
import {
  bigKeysBatch1k,
  invalidKeyBadGenesisForkVersion,
  invalidKeyBadWC,
  validKey,
} from './fixtures/keys';
import { withTimer } from '@lido-nestjs/utils';
import {
  Key,
  KeyValidator,
  KeyValidatorInterface,
  KeyValidatorModule,
  MultiThreadedKeyValidatorExecutor,
} from '../src';
import { Test } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';

describe('KeyValidator', () => {
  jest.setTimeout(30000);

  const getKeyValidator = async (multithreaded: boolean) => {
    const module: ModuleMetadata = {
      imports: [KeyValidatorModule.forFeature({ multithreaded })],
    };
    const moduleRef = await Test.createTestingModule(module).compile();
    return moduleRef.get<KeyValidator>(KeyValidatorInterface);
  };

  test('[single-thread] should successfully validate a valid key', async () => {
    const keyValidator = await getKeyValidator(false);
    const resSingle = await keyValidator.validateKey(validKey);

    expect(resSingle).toBe(true);

    const resMultiple = await keyValidator.validateKeys([validKey, validKey]);

    expect(resMultiple).toBeInstanceOf(Array);
    expect(resMultiple.length).toBe(2);
    expect(resMultiple[0]).toBeInstanceOf(Array);
    expect(resMultiple[0].length).toBe(2);
    expect(resMultiple[0][0]).toStrictEqual(validKey);
    expect(resMultiple[0][1]).toBe(true);
  });

  test('[multi-thread] should successfully validate a valid key', async () => {
    const keyValidator = await getKeyValidator(true);
    const resSingle = await keyValidator.validateKey(validKey);

    expect(resSingle).toBe(true);

    const resMultiple = await keyValidator.validateKeys([validKey, validKey]);

    expect(resMultiple).toBeInstanceOf(Array);
    expect(resMultiple.length).toBe(2);
    //expect(resMultiple[0]).toBeInstanceOf(Array);
    expect(resMultiple[0].length).toBe(2);

    expect(resMultiple[0][0].key).toStrictEqual(validKey.key);
    expect(resMultiple[0][0].depositSignature).toStrictEqual(
      validKey.depositSignature,
    );
    expect(resMultiple[0][0].withdrawalCredentials).toStrictEqual(
      validKey.withdrawalCredentials,
    );
    expect(resMultiple[0][0].genesisForkVersion).toStrictEqual(
      validKey.genesisForkVersion,
    );
    expect(resMultiple[0][0].domainDeposit).toStrictEqual(
      validKey.domainDeposit,
    );
    expect(resMultiple[0][0].amount).toStrictEqual(validKey.amount);
    expect(resMultiple[0][0].zeroHash).toStrictEqual(validKey.zeroHash);
    expect(resMultiple[0][1]).toBe(true);
  });

  test('[single-thread] should return false on valid key but bad amount', async () => {
    const keyValidator = await getKeyValidator(false);
    const res = await keyValidator.validateKey({
      ...validKey,
      amount: 2 * 10 ** 9,
    });

    expect(res).toBe(false);
  });

  test('[multi-thread] should return false on valid key but bad amount', async () => {
    const keyValidator = await getKeyValidator(true);
    const res = await keyValidator.validateKey({
      ...validKey,
      amount: 2 * 10 ** 9,
    });

    expect(res).toBe(false);
  });

  test('[single-thread] should return false on valid key but bad domain deposit', async () => {
    const keyValidator = await getKeyValidator(false);
    const res = await keyValidator.validateKey({
      ...validKey,
      domainDeposit: Buffer.from('0324124'),
    });

    expect(res).toBe(false);
  });

  test('[multi-thread] should return false on valid key but bad domain deposit', async () => {
    const keyValidator = await getKeyValidator(true);
    const res = await keyValidator.validateKey({
      ...validKey,
      domainDeposit: Buffer.from('0324124'),
    });

    expect(res).toBe(false);
  });

  test('[single-thread] should return false on invalid key with bad WC', async () => {
    const keyValidator = await getKeyValidator(false);
    const res = await keyValidator.validateKey(invalidKeyBadWC);

    expect(res).toBe(false);
  });

  test('[multi-thread] should return false on invalid key with bad WC', async () => {
    const keyValidator = await getKeyValidator(true);
    const res = await keyValidator.validateKey(invalidKeyBadWC);

    expect(res).toBe(false);
  });

  test('[single-thread] should return false on invalid key with bad GenesisForkVersion', async () => {
    const keyValidator = await getKeyValidator(true);
    const res = await keyValidator.validateKey(invalidKeyBadGenesisForkVersion);

    expect(res).toBe(false);
  });

  test('[multi-thread] should return false on invalid key with bad GenesisForkVersion', async () => {
    const keyValidator = await getKeyValidator(true);
    const res = await keyValidator.validateKey(invalidKeyBadGenesisForkVersion);

    expect(res).toBe(false);
  });

  test('[single-thread] should validate empty array immediately', async () => {
    const keyValidator = await getKeyValidator(false);
    const [res, time] = await withTimer(() => keyValidator.validateKeys([]));

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('[multi-thread] should validate empty array immediately', async () => {
    const keyValidator = await getKeyValidator(true);
    const [res, time] = await withTimer(() => keyValidator.validateKeys([]));

    expect(res.length).toBe(0);
    expect(time).toBeLessThan(0.01);
  });

  test('[multi-thread] should correctly handle destroy after validation', async () => {
    const keyValidator = await getKeyValidator(true);

    expect(keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
    if (keyValidator.executor instanceof MultiThreadedKeyValidatorExecutor) {
      expect(keyValidator.executor.threadPool).toBeNull();
      const res = await keyValidator.validateKeys([validKey]);
      expect(res.length).toBe(1);
      expect(keyValidator.executor.threadPool).not.toBeNull();
      await keyValidator.executor.destroy();
      expect(keyValidator.executor.threadPool).toBeNull();
    }
  });

  test('[multi-thread] should correctly handle destroy before validation', async () => {
    const keyValidator = await getKeyValidator(true);

    expect(keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
    if (keyValidator.executor instanceof MultiThreadedKeyValidatorExecutor) {
      await keyValidator.executor.destroy();
      expect(keyValidator.executor.threadPool).toBeNull();
    }
  });

  test('[single-thread] should successfully validate a valid key with custom properties', async () => {
    const keyValidator = await getKeyValidator(false);

    type CustomKey = Key & { extra: string };

    const keyWithCustomProperties: CustomKey = {
      ...validKey,
      extra: 'have a nice day',
    };
    const resSingle = await keyValidator.validateKey(keyWithCustomProperties);

    expect(resSingle).toBe(true);

    const resMultiple = await keyValidator.validateKeys([
      keyWithCustomProperties,
    ]);

    expect(resMultiple[0][0]).toHaveProperty('extra');
    expect(resMultiple[0][0].extra).toBe(keyWithCustomProperties.extra);
    expect(resMultiple[0][0]).toStrictEqual(keyWithCustomProperties);
    expect(resMultiple[0][1]).toStrictEqual(true);
  });

  test('[multi-thread] should successfully validate a valid key with custom properties', async () => {
    const keyValidator = await getKeyValidator(true);

    type CustomKey = Key & { extra: string };

    const keyWithCustomProperties: CustomKey = {
      ...validKey,
      extra: 'have a nice day',
    };
    const resSingle = await keyValidator.validateKey(keyWithCustomProperties);

    expect(resSingle).toBe(true);

    const resMultiple = await keyValidator.validateKeys([
      keyWithCustomProperties,
    ]);

    expect(resMultiple[0][0]).toHaveProperty('extra');
    expect(resMultiple[0][0].extra).toBe(keyWithCustomProperties.extra);
    expect(resMultiple[0][0].key).toStrictEqual(keyWithCustomProperties.key);
    expect(resMultiple[0][0].depositSignature).toStrictEqual(
      keyWithCustomProperties.depositSignature,
    );
    expect(resMultiple[0][0].withdrawalCredentials).toStrictEqual(
      keyWithCustomProperties.withdrawalCredentials,
    );
    expect(resMultiple[0][0].genesisForkVersion).toStrictEqual(
      keyWithCustomProperties.genesisForkVersion,
    );
    expect(resMultiple[0][0].domainDeposit).toStrictEqual(
      keyWithCustomProperties.domainDeposit,
    );
    expect(resMultiple[0][1]).toStrictEqual(true);
  });

  test('[single-thread] 1k keys benchmark should run OK', async () => {
    const keyValidator = await getKeyValidator(false);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKeys(bigKeysBatch1k),
    );

    expect(res.length).toBe(1000);
    expect(time).toBeLessThan(30); // 30 seconds
  });

  test('[multi-thread] 1k keys benchmark should run OK', async () => {
    const keyValidator = await getKeyValidator(true);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKeys(bigKeysBatch1k),
    );

    expect(res.length).toBe(1000);
    expect(time).toBeLessThan(15); // 30 seconds

    if (keyValidator.executor instanceof MultiThreadedKeyValidatorExecutor) {
      await keyValidator.executor.destroy();
    }
  });
});
