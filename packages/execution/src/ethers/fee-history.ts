/* eslint-disable @typescript-eslint/no-explicit-any */
import { BigNumber } from '@ethersproject/bignumber';
import { hexValue } from '@ethersproject/bytes';
import { formatBlockNumber } from './format-block-number';
import { ExtendedJsonRpcBatchProvider } from '../provider/extended-json-rpc-batch-provider';
import { SimpleFallbackJsonRpcBatchProvider } from '../provider/simple-fallback-json-rpc-batch-provider';
import { Logger } from '@ethersproject/logger';
const logger = new Logger('packages/execution');

export const MIN_BLOCKCOUNT = 1;
export const MAX_BLOCKCOUNT = 1024;

export interface FeeHistory {
  oldestBlock: number;
  baseFeePerGas: BigNumber[];
  gasUsedRatio: number[];
  reward: BigNumber[][];
}

export async function getFeeHistory(
  this: ExtendedJsonRpcBatchProvider | SimpleFallbackJsonRpcBatchProvider,
  blockCount: number,
  newestBlock?: string | null | number,
  rewardPercentiles?: number[],
): Promise<FeeHistory> {
  await this.getNetwork();

  if (blockCount < MIN_BLOCKCOUNT || blockCount > MAX_BLOCKCOUNT) {
    logger.throwArgumentError(
      'Invalid blockCount for `getFeeHistory`. Should be between 1 and 1024.',
      'blockCount',
      blockCount,
    );
  }

  const params = {
    blockCount: hexValue(blockCount),
    newestBlock: formatBlockNumber(newestBlock),
    rewardPercentiles,
  };

  const result: any = await this.perform('getFeeHistory', params);

  return {
    baseFeePerGas: result.baseFeePerGas.map((x: string) => BigNumber.from(x)),
    gasUsedRatio: result.gasUsedRatio,
    oldestBlock: BigNumber.from(result.oldestBlock).toNumber(),
    reward: (result.reward ?? []).map((x: string[]) =>
      x.map((y) => BigNumber.from(y)),
    ),
  };
}
