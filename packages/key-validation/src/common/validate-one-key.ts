import { DOMAIN_DEPOSIT, ZERO_HASH } from '../constants/constants';
import { bufferFromHexString } from './buffer-hex';
import { computeDomain } from './domain';
import { computeSigningRoot } from './compute-signing-root';
import { DepositMessage } from '../ssz';
import { PublicKey, Signature, verify } from '@chainsafe/blst';
import { Pubkey, WithdrawalCredentialsBuffer } from '../interfaces';
import { getDepositMessage } from './deposit';

export const validateOneKey = (
  key: Pubkey,
  depositSignature: string,
  withdrawalCredentials: WithdrawalCredentialsBuffer,
  genesisForkVersion: Buffer,
  amount: number = 32 * 10 ** 9,
  domainDeposit: Buffer = DOMAIN_DEPOSIT,
  zeroHash: Buffer = ZERO_HASH,
): boolean => {
  const pubkeyBuffer = bufferFromHexString(key);
  const signatureBuffer = bufferFromHexString(depositSignature);
  const depositMessage = getDepositMessage(
    pubkeyBuffer,
    withdrawalCredentials,
    amount,
  );
  const domain = computeDomain(domainDeposit, genesisForkVersion, zeroHash);
  const signingRoot = computeSigningRoot(
    DepositMessage,
    depositMessage,
    domain,
  );

  try {
    return verify(
      signingRoot,
      PublicKey.fromBytes(pubkeyBuffer, true),
      Signature.fromBytes(signatureBuffer, true),
    );
  } catch (e) {
    return false;
  }
};
