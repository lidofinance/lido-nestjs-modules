import { CHAINS } from '@lido-nestjs/constants/src';
import {
  DOMAIN_DEPOSIT,
  GENESIS_FORK_VERSION,
  ZERO_HASH,
} from '../constants/constants';
import { bufferFromHexString } from './buffer-hex';
import { computeDomain } from './domain';
import { computeSigningRoot } from './compute-signing-root';
import { DepositMessage } from '../ssz';
import { CoordType, PublicKey, Signature, verify } from '@chainsafe/blst';
import {
  Key,
  LidoKey,
  PossibleWC,
  Pubkey,
  WithdrawalCredentialsBuffer,
} from '../interfaces/common';

export const getDepositMessage = (
  publicKey: Buffer,
  withdrawalCredentials: Buffer,
) => {
  const REQUIRED_DEPOSIT_ETH = 32;
  const ETH2GWEI = 10 ** 9;
  const amount = REQUIRED_DEPOSIT_ETH * ETH2GWEI;

  return {
    pubkey: publicKey,
    withdrawalCredentials: withdrawalCredentials,
    amount,
  };
};

export const validateKey = (
  key: Key,
  withdrawalCredentials: WithdrawalCredentialsBuffer,
  genesisForkVersion: Buffer,
) => {
  const pubkeyBuffer = bufferFromHexString(key.key);
  const signatureBuffer = bufferFromHexString(key.depositSignature);
  const depositMessage = getDepositMessage(pubkeyBuffer, withdrawalCredentials);
  const domain = computeDomain(DOMAIN_DEPOSIT, genesisForkVersion, ZERO_HASH);
  const signingRoot = computeSigningRoot(
    DepositMessage,
    depositMessage,
    domain,
  );

  try {
    return verify(
      signingRoot,
      PublicKey.fromBytes(pubkeyBuffer, CoordType.affine),
      Signature.fromBytes(signatureBuffer, CoordType.affine),
    );
  } catch (e) {
    return false;
  }
};

export const validateLidoKeyForPossibleWC = (
  possibleWC: PossibleWC,
  lidoKey: LidoKey,
  chainId: CHAINS,
): [Pubkey, boolean] => {
  const genesisForkVersion = GENESIS_FORK_VERSION[chainId];

  if (!genesisForkVersion) {
    throw new Error(
      `Genesis fork version is undefined for chain [${chainId}]. See GENESIS_FORK_VERSION constant`,
    );
  }

  if (!lidoKey.used) {
    return [
      lidoKey.key,
      validateKey(lidoKey, possibleWC.currentWC[1], genesisForkVersion),
    ];
  }

  const resultsForCurrentWC = validateKey(
    lidoKey,
    possibleWC.currentWC[1],
    genesisForkVersion,
  );

  if (resultsForCurrentWC) {
    return [lidoKey.key, resultsForCurrentWC];
  }

  const resultsForOldWC = possibleWC.previousWC.map((wc) =>
    validateKey(lidoKey, wc[1], genesisForkVersion),
  );

  return [lidoKey.key, resultsForOldWC.some((x) => x)];
};
