/**
 * Thrown when waitForTransactionWithFallback times out.
 * lastError distinguishes network issues (present) from slow tx (null).
 */
export class TransactionWaitTimeoutError extends Error {
  public name: string;
  public txHash: string;
  public timeoutMs: number;
  public lastError: Error | null;

  constructor(txHash: string, timeoutMs: number, lastError: Error | null) {
    const baseMessage = `Transaction ${txHash} not confirmed within ${timeoutMs}ms`;
    const errorContext = lastError
      ? `. Last provider error: ${lastError.message}`
      : ' (no provider errors, transaction may still be pending)';

    super(baseMessage + errorContext);

    this.name = 'TransactionWaitTimeoutError';
    this.txHash = txHash;
    this.timeoutMs = timeoutMs;
    this.lastError = lastError;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
