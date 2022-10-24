import { ContainerType, ValueOf } from '@chainsafe/ssz';
import {
  BLSPubkey,
  Bytes32,
  Domain,
  Epoch,
  Root,
  UintNum64,
  Version,
} from './primitive/ssz-types';

export const Fork = new ContainerType(
  {
    previousVersion: Version,
    currentVersion: Version,
    epoch: Epoch,
  },
  { typeName: 'Fork', jsonCase: 'eth2' },
);

export const ForkData = new ContainerType(
  {
    currentVersion: Version,
    genesisValidatorsRoot: Root,
  },
  { typeName: 'ForkData', jsonCase: 'eth2' },
);

export const SigningData = new ContainerType(
  {
    objectRoot: Root,
    domain: Domain,
  },
  { typeName: 'SigningData', jsonCase: 'eth2' },
);

export const DepositMessage = new ContainerType(
  {
    pubkey: BLSPubkey,
    withdrawalCredentials: Bytes32,
    amount: UintNum64,
  },
  { typeName: 'DepositMessage', jsonCase: 'eth2' },
);

export type ForkData = ValueOf<typeof ForkData>;
export type DepositMessage = ValueOf<typeof DepositMessage>;
export type Fork = ValueOf<typeof Fork>;
export type SigningData = ValueOf<typeof SigningData>;
