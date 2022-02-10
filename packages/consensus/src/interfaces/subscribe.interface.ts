import { ConsensusMethodResult } from './consensus.interface';

export interface ConsensusSubscribeCallback {
  (error: ConsensusSubscribeError, block: ConsensusSubscribeBlock): void;
}

export type ConsensusSubscribeError = unknown | null;
export type ConsensusSubscribeBlock =
  | Awaited<ConsensusMethodResult<'getBlock'>>['data']
  | null;
