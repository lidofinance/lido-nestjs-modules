/* eslint-disable @typescript-eslint/no-var-requires */
import {
  bigKeysBatch10k,
  invalidKeyBadGenesisForkVersion,
  invalidKeyBadWC,
  validKey,
} from './fixtures/keys';
import { withTimer } from '@lido-nestjs/utils';
import {
  KeyValidator,
  KeyValidatorInterface,
  KeyValidatorModule,
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
    const res = await keyValidator.validateKey(validKey);

    expect(res).toBe(true);
  });

  test('[multi-thread] should successfully validate a valid key', async () => {
    const keyValidator = await getKeyValidator(false);
    const res = await keyValidator.validateKey(validKey);

    expect(res).toBe(true);
  });

  test('[multi-thread] should successfully validate a valid key', async () => {
    const keyValidator = await getKeyValidator(true);
    const res = await keyValidator.validateKey(validKey);

    expect(res).toBe(true);
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

  test('[single-thread] 10k keys benchmark should run OK', async () => {
    const keyValidator = await getKeyValidator(false);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKeys(bigKeysBatch10k),
    );

    expect(res.length).toBe(10000);
    expect(time).toBeLessThan(60); // 60 seconds
  });

  test('[multi-thread] 10k keys benchmark should run OK', async () => {
    const keyValidator = await getKeyValidator(true);

    const [res, time] = await withTimer(() =>
      keyValidator.validateKeys(bigKeysBatch10k),
    );

    expect(res.length).toBe(10000);
    expect(time).toBeLessThan(30); // 30 seconds
  });
});
