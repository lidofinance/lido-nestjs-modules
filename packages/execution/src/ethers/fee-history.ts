import { BigNumber } from '@ethersproject/bignumber';

export interface FeeHistory {
  oldestBlock: number;
  baseFeePerGas: BigNumber[];
  gasUsedRatio?: number[];
  reward: BigNumber[][];
}
