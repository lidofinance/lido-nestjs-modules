import {
  DOMAIN_DEPOSIT,
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
import { getDepositMessage } from './deposit';

export const validateKey = (
  key: Key,
  withdrawalCredentials: WithdrawalCredentialsBuffer,
  genesisForkVersion: Buffer,
  amount: number =  32 * (10 ** 9),
  domainDeposit: Buffer = DOMAIN_DEPOSIT,
  zeroHash: Buffer = ZERO_HASH,
) => {
  const pubkeyBuffer = bufferFromHexString(key.key);
  const signatureBuffer = bufferFromHexString(key.depositSignature);
  const depositMessage = getDepositMessage(pubkeyBuffer, withdrawalCredentials, amount);
  const domain = computeDomain(domainDeposit, genesisForkVersion, zeroHash);
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
  genesisForkVersion: Buffer,
): [Pubkey, boolean] => {
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

