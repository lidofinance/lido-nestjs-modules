import { components, operations } from './generated.interface';

type S = components['schemas'];

export const CONSENSUS_FORKS = [
  'phase0',
  'altair',
  'bellatrix',
  'capella',
  'deneb',
  'electra',
  'fulu',
  'gloas',
] as const;

export type ConsensusFork = typeof CONSENSUS_FORKS[number];

/** Forks where the block body carries the execution payload. */
export const EXECUTION_PAYLOAD_FORKS = [
  'bellatrix',
  'capella',
  'deneb',
  'electra',
  'fulu',
] as const;

export type ExecutionPayloadFork = typeof EXECUTION_PAYLOAD_FORKS[number];

/** Forks where the block body carries a signed execution payload bid and the payload comes in an envelope. */
export const EXECUTION_PAYLOAD_BID_FORKS = ['gloas'] as const;

export type ExecutionPayloadBidFork =
  typeof EXECUTION_PAYLOAD_BID_FORKS[number];

export interface SignedBeaconBlockByFork {
  phase0: S['Phase0.SignedBeaconBlock'];
  altair: S['Altair.SignedBeaconBlock'];
  bellatrix: S['Bellatrix.SignedBeaconBlock'];
  capella: S['Capella.SignedBeaconBlock'];
  deneb: S['Deneb.SignedBeaconBlock'];
  electra: S['Electra.SignedBeaconBlock'];
  fulu: S['Electra.SignedBeaconBlock'];
  gloas: S['Gloas.SignedBeaconBlock'];
}

export interface BeaconStateByFork {
  phase0: S['Phase0.BeaconState'];
  altair: S['Altair.BeaconState'];
  bellatrix: S['Bellatrix.BeaconState'];
  capella: S['Capella.BeaconState'];
  deneb: S['Deneb.BeaconState'];
  electra: S['Electra.BeaconState'];
  fulu: S['Fulu.BeaconState'];
  gloas: S['Gloas.BeaconState'];
}

type BlockResponse =
  operations['getBlockV2']['responses'][200]['content']['application/json'];
type StateResponse =
  operations['getStateV2']['responses'][200]['content']['application/json'];

/** Response of getBlockV2, a union discriminated by `version`. */
export type VersionedSignedBeaconBlock<
  F extends ConsensusFork = ConsensusFork,
> = {
  [K in F]: Omit<BlockResponse, 'version' | 'data'> & {
    version: K;
    data: SignedBeaconBlockByFork[K];
  };
}[F];

/** Response of getStateV2, a union discriminated by `version`. */
export type VersionedBeaconState<F extends ConsensusFork = ConsensusFork> = {
  [K in F]: Omit<StateResponse, 'version' | 'data'> & {
    version: K;
    data: BeaconStateByFork[K];
  };
}[F];
