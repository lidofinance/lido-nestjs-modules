import { ErrorCode } from '@ethersproject/logger';

export const nonRetryableErrors: (string | number)[] = [
  ///////////////////
  // Generic Errors

  // Not Implemented
  ErrorCode.NOT_IMPLEMENTED,

  ///////////////////
  // Operational  Errors

  // Buffer Overrun
  ErrorCode.BUFFER_OVERRUN,

  // Numeric Fault
  //   - operation: the operation being executed
  //   - fault: the reason this faulted
  ErrorCode.NUMERIC_FAULT,

  ///////////////////
  // Argument Errors

  // Missing new operator to an object
  //  - name: The name of the class
  ErrorCode.MISSING_NEW,

  // Invalid argument (e.g. value is incompatible with type) to a function:
  //   - argument: The argument name that was invalid
  //   - value: The value of the argument
  ErrorCode.INVALID_ARGUMENT,

  // Missing argument to a function:
  //   - count: The number of arguments received
  //   - expectedCount: The number of arguments expected
  ErrorCode.MISSING_ARGUMENT,

  // Too many arguments
  //   - count: The number of arguments received
  //   - expectedCount: The number of arguments expected
  ErrorCode.UNEXPECTED_ARGUMENT,

  ///////////////////
  // Blockchain Errors

  // Call exception
  //  - transaction: the transaction
  //  - address?: the contract address
  //  - args?: The arguments passed into the function
  //  - method?: The Solidity method signature
  //  - errorSignature?: The EIP848 error signature
  //  - errorArgs?: The EIP848 error parameters
  //  - reason: The reason (only for EIP848 "Error(string)")
  ErrorCode.CALL_EXCEPTION,

  // Insufficient funds (< value + gasLimit * gasPrice)
  //   - transaction: the transaction attempted
  ErrorCode.INSUFFICIENT_FUNDS,

  // Nonce has already been used
  //   - transaction: the transaction attempted
  ErrorCode.NONCE_EXPIRED,

  // The replacement fee for the transaction is too low
  //   - transaction: the transaction attempted
  ErrorCode.REPLACEMENT_UNDERPRICED,

  // The gas limit could not be estimated
  //   - transaction: the transaction passed to estimateGas
  ErrorCode.UNPREDICTABLE_GAS_LIMIT,

  // The transaction was replaced by one with a higher gas price
  //   - reason: "cancelled", "replaced" or "repriced"
  //   - cancelled: true if reason == "cancelled" or reason == "replaced")
  //   - hash: original transaction hash
  //   - replacement: the full TransactionsResponse for the replacement
  //   - receipt: the receipt of the replacement
  ErrorCode.TRANSACTION_REPLACED,
];

export type ErrorWithCode = Error & { code: number | string };
export type HasErrorProperty = { error: object };
export type HasServerErrorProperty = { serverError: object };

export const isErrorHasCode = (error: unknown): error is ErrorWithCode => {
  return (
    error instanceof Error &&
    Object.prototype.hasOwnProperty.call(error, 'code')
  );
};
export const hasErrorProperty = (error: unknown): error is HasErrorProperty => {
  return Object.prototype.hasOwnProperty.call(error, 'error');
};

export const hasServerErrorProperty = (
  error: unknown,
): error is HasServerErrorProperty => {
  return Object.prototype.hasOwnProperty.call(error, 'serverError');
};

/**
 * Detect that ethers error is a server error.
 *
 * Note: Ethers v5 error management is not very clean,
 * and ethers error can be nested.
 *
 */
export const isEthersServerError = (error: unknown) => {
  return (
    hasServerErrorProperty(error) || // nesting level 0
    (hasErrorProperty(error) && hasServerErrorProperty(error.error)) || // nesting level 1
    (hasErrorProperty(error) &&
      hasErrorProperty(error.error) &&
      hasServerErrorProperty(error.error.error)) // nesting level 2
  );
};
