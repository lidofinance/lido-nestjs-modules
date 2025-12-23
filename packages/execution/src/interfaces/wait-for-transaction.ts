import { TransactionReceipt } from '@ethersproject/abstract-provider';

export interface WaitForTransactionOptions {
  /** Max wait time in ms. @default 60000 */
  timeout?: number;
  /** Polling interval in ms. @default 3000 */
  pollInterval?: number;
  /** Required confirmations. @default 1 */
  confirmations?: number;
}

export interface WaitForTransactionResult {
  receipt: TransactionReceipt;
  pollCount: number;
  elapsedMs: number;
}
