import { ErrorCode, Logger } from '@ethersproject/logger';
import { isEthersServerError } from '../src/common/errors';

describe('Ether errors. ', () => {
  test('should properly detect nested server errors for ethers v5', async () => {
    const etherslogger = new Logger('0.0.0');

    // making some ETIMEDOUT server error
    const serverError = etherslogger.makeError(
      'missing response',
      Logger.errors.SERVER_ERROR,
      {
        requestBody: {
          method: 'eth_call',
          params: [
            {
              blockHash:
                '0xafcede9d00617b7befdea44c0ad4d9f6a6f82909f12f796c8233ed290a5c6d91',
            },
          ],
          id: 204601,
          jsonrpc: '2.0',
        },
        requestMethod: 'POST',
        serverError: {
          errno: -60,
          code: 'ETIMEDOUT',
          syscall: 'connect',
          address: '127.0.0.1',
          port: 80,
        },
        url: 'http://some-rpc-provider',
      },
    );

    const highLevelError1 = etherslogger.makeError(
      'high level error 1',
      ErrorCode.CALL_EXCEPTION,
      { error: serverError },
    );

    const highLevelError2 = etherslogger.makeError(
      'high level error 2',
      ErrorCode.UNKNOWN_ERROR,
      { error: highLevelError1 },
    );

    // no error nesting
    expect(isEthersServerError(serverError)).toBe(true);

    // 1-level nesting
    expect(isEthersServerError(highLevelError1)).toBe(true);

    // 2-level nesting
    expect(isEthersServerError(highLevelError2)).toBe(true);
  });
});
