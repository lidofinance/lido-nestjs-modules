/* eslint-disable @typescript-eslint/no-var-requires */
import { validateLidoKeyForPossibleWC, PossibleWC } from '../src';
import { CHAINS } from '@lido-nestjs/constants';
import {
  currentWC,
  invalidUnusedKey,
  validUnusedKeyCurrentWC,
  validUsedKey,
  validUsedKeyCurrentWC,
} from './keys';
import { GENESIS_FORK_VERSION } from '../dist';

describe('validateKey function', () => {
  const genesisForkVersion: Buffer = GENESIS_FORK_VERSION[CHAINS.Mainnet] ?? Buffer.alloc(0);

  const possibleWC: PossibleWC = {
    currentWC: [currentWC, Buffer.from(currentWC.replace('0x', ''), 'hex')],
    previousWC: [],
  };

  test('should validate a valid used key made with old WC for current WC and return false', async () => {
    const res = validateLidoKeyForPossibleWC(
      possibleWC,
      validUsedKey,
      genesisForkVersion,
    );

    expect(res[0]).toBe(validUsedKey.key);
    expect(res[1]).toBe(false);
  });

  test('should validate used key made current WC for current WC and return true', async () => {
    const res = validateLidoKeyForPossibleWC(
      possibleWC,
      validUsedKeyCurrentWC,
      genesisForkVersion,
    );

    expect(res[0]).toBe(validUsedKeyCurrentWC.key);
    expect(res[1]).toBe(true);
  });

  test('should validate unused key made current WC for current WC and return true', async () => {
    const res = validateLidoKeyForPossibleWC(
      possibleWC,
      validUnusedKeyCurrentWC,
      genesisForkVersion,
    );

    expect(res[0]).toBe(validUnusedKeyCurrentWC.key);
    expect(res[1]).toBe(true);
  });

  test('should validate unused key made with old WC for current WC and return false', async () => {
    const res = validateLidoKeyForPossibleWC(
      possibleWC,
      invalidUnusedKey,
      genesisForkVersion,
    );

    expect(res[0]).toBe(invalidUnusedKey.key);
    expect(res[1]).toBe(false);
  });
});
