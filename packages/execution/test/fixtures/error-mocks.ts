/**
 * Error mocks that end up in `this.logger.error(e)`
 * in SimpleFallbackJsonRpcBatchProvider.perform() (lines ~423/436/444).
 *
 * Each mock is the exact structure of the `e` object in the catch block.
 */

import { FetchError } from '../../src/error/fetch.error';
import { RequestTimeoutError } from '../../src/error/request-timeout.error';
import { AllProvidersFailedError } from '../../src/error/all-providers-failed.error';
import { ErrorCode } from '../../src/error/codes/error-codes';

// ============================================================
// 1. FetchError — UNEXPECTED_BATCH_RESULT
//    Created in extended-json-rpc-batch-provider.ts:218-222
//    When batchResult is not an array (provider returned a single error object)
// ============================================================
export function createFetchErrorUnexpectedBatchResult(): FetchError {
  const error = new FetchError(
    'Unexpected batch result. Possible reason: "rate limit exceeded".',
  );
  error.code = ErrorCode.UNEXPECTED_BATCH_RESULT;
  error.data = {
    code: -32005,
    message: 'rate limit exceeded',
  };
  return error;
}

// ============================================================
// 2. FetchError — PARTIAL_BATCH_RESULT
//    Created in extended-json-rpc-batch-provider.ts:235-243
//    When the batch response is missing a payload for one of the requests
// ============================================================
export function createFetchErrorPartialBatchResult(): FetchError {
  const error = new FetchError(
    'Partial payload batch result. Response 7 not found',
  );
  error.code = ErrorCode.PARTIAL_BATCH_RESULT;
  error.data = {
    requestedId: 7,
    receivedIds: [1, 2, 3, 4, 5, 6],
    batchSize: 6,
  };
  return error;
}

// ============================================================
// 3. FetchError — JSON-RPC error in response
//    Created in extended-json-rpc-batch-provider.ts:246-248
//    When a specific payload in the batch contains an error field
// ============================================================
export function createFetchErrorJsonRpcError(): FetchError {
  const error = new FetchError('execution reverted');
  error.code = -32000;
  error.data =
    '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001a4e6f7420656e6f75676820616c6c6f77616e636500000000000000000000000000';
  return error;
}

// ============================================================
// 4. RequestTimeoutError
//    Created in simple-fallback-json-rpc-batch-provider.ts:318-323
//    When the request did not complete within requestTimeoutMs
// ============================================================
export function createRequestTimeoutError(): RequestTimeoutError {
  return new RequestTimeoutError('Request timeout after 12000ms', 12000);
}

// ============================================================
// 5. Ethers SERVER_ERROR — single request (from fetchJson in @ethersproject/web)
//    Created via Logger.makeError() inside ethers
//    when an HTTP request to the node returns a non-200 status.
//    requestBody — a single JSON-RPC object.
// ============================================================
export function createEthersServerError(): Error {
  const error = new Error(
    'missing response (requestBody={"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3","address":"0xae7ab96520de3a18e5e111b5eaab095312d7fe84"}],"id":42,"jsonrpc":"2.0"}, requestMethod="POST", serverError={"code":"ECONNRESET"}, url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")',
  );

  Object.assign(error, {
    reason: 'missing response',
    code: 'SERVER_ERROR',
    requestBody:
      '{"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3","address":"0xae7ab96520de3a18e5e111b5eaab095312d7fe84"}],"id":42,"jsonrpc":"2.0"}',
    requestMethod: 'POST',
    serverError: {
      code: 'ECONNRESET',
      name: 'Error',
      message: 'socket hang up',
    },
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 5a. Ethers SERVER_ERROR — batch/chunk (from fetchJson in _batchAggregatorTick)
//     extended-json-rpc-batch-provider.ts:190-198
//     fetchJson(connection, JSON.stringify(batchRequest)) sends
//     a chunk of N requests in one HTTP call. If the HTTP call fails —
//     requestBody contains an ARRAY of JSON-RPC requests.
//     This error is rejected into ALL N promises from the batch (lines 267-269).
//     In the fallback provider this is the same catch(e) at line 402,
//     but e arrives N times (once per perform()).
//     Protection against N switches: lines 452-455 (lastPerformError != e).
// ============================================================
export function createEthersServerErrorBatchChunk(): Error {
  const batchRequestBody = JSON.stringify([
    {
      method: 'eth_getBlockByNumber',
      params: ['0x131b79f', false],
      id: 1,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getBlockByNumber',
      params: ['0x131b7a0', false],
      id: 2,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getBalance',
      params: ['0xae7ab96520de3a18e5e111b5eaab095312d7fe84', '0x131b79f'],
      id: 3,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_call',
      params: [
        {
          to: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
          data: '0x70a08231000000000000000000000000d15a672319cf0352560ee76d9e89eab0889046d3',
        },
        '0x131b79f',
      ],
      id: 4,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_call',
      params: [
        {
          to: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
          data: '0x18160ddd',
        },
        '0x131b79f',
      ],
      id: 5,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: '0x131b79f',
          toBlock: '0x131b7a3',
          address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        },
      ],
      id: 6,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getTransactionReceipt',
      params: ['0x' + 'ab'.repeat(32)],
      id: 7,
      jsonrpc: '2.0',
    },
  ]);

  const error = new Error(
    `missing response (requestBody=${batchRequestBody}, requestMethod="POST", serverError={"code":"ECONNRESET"}, url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")`,
  );

  Object.assign(error, {
    reason: 'missing response',
    code: 'SERVER_ERROR',
    requestBody: batchRequestBody,
    requestMethod: 'POST',
    serverError: {
      code: 'ECONNRESET',
      name: 'Error',
      message: 'socket hang up',
    },
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 5b. Ethers SERVER_ERROR — batch/chunk with HTTP 413 (payload too large)
//     When a chunk of jsonRpcMaxBatchSize (up to 200) requests is too large
//     and the RPC provider or reverse proxy rejects it by size.
//     requestBody — array of JSON-RPC requests.
// ============================================================
export function createEthersServerErrorBatchTooLarge(): Error {
  const batchRequestBody = JSON.stringify(
    Array.from({ length: 200 }, (_, i) => ({
      method: 'eth_call',
      params: [
        {
          to: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
          data:
            '0x70a08231000000000000000000000000' +
            i.toString(16).padStart(40, '0'),
        },
        '0x131b79f',
      ],
      id: i + 1,
      jsonrpc: '2.0',
    })),
  );

  const responseBody = '{"error":"request entity too large"}';

  const error = new Error(
    `bad response (status=413, headers={"content-type":"application/json","content-length":"36"}, body=${responseBody}, requestBody=<${batchRequestBody.length} bytes>, requestMethod="POST", url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")`,
  );

  Object.assign(error, {
    reason: 'bad response',
    code: 'SERVER_ERROR',
    status: 413,
    headers: {
      'content-type': 'application/json',
      'content-length': '36',
    },
    body: responseBody,
    requestBody: batchRequestBody,
    requestMethod: 'POST',
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 5c. Ethers SERVER_ERROR — batch/chunk with HTTP 429 (rate limit)
//     The entire chunk is rejected due to rate limiting. All N requests
//     in the chunk receive the same error via inflightRequest.reject().
// ============================================================
export function createEthersServerErrorBatchRateLimited(): Error {
  const batchRequestBody = JSON.stringify([
    {
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
      id: 1,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getBalance',
      params: ['0xae7ab96520de3a18e5e111b5eaab095312d7fe84', 'latest'],
      id: 2,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_chainId',
      params: [],
      id: 3,
      jsonrpc: '2.0',
    },
  ]);

  const responseBody = JSON.stringify({
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32005,
      message: 'daily request count exceeded, request rate limited',
      data: {
        rate: { allowed_rps: 10, backoff_seconds: 30, current_rps: 25.3 },
        see: 'https://infura.io/dashboard',
      },
    },
  });

  const error = new Error(
    `bad response (status=429, headers={"content-type":"application/json","retry-after":"30"}, body=${responseBody}, requestBody=${batchRequestBody}, requestMethod="POST", url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")`,
  );

  Object.assign(error, {
    reason: 'bad response',
    code: 'SERVER_ERROR',
    status: 429,
    headers: {
      'content-type': 'application/json',
      'retry-after': '30',
    },
    body: responseBody,
    requestBody: batchRequestBody,
    requestMethod: 'POST',
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 5d. Ethers SERVER_ERROR — batch/chunk, proxy timeout (502/504)
//     An eth_getLogs chunk was sent, processing on the node took too long,
//     and the reverse proxy (nginx/cloudflare/ALB) returned a full HTTP 502/504 response.
//     Unlike ECONNRESET, the response WAS received in full — so the error
//     has body, status, headers. body contains HTML or JSON from the proxy.
//     requestBody — array of JSON-RPC requests (the entire chunk).
// ============================================================
export function createEthersServerErrorBatchProxyTimeout(): Error {
  const batchRequestBody = JSON.stringify([
    {
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: '0x100000',
          toBlock: '0x100FFF',
          address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        },
      ],
      id: 1,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: '0x101000',
          toBlock: '0x101FFF',
          address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        },
      ],
      id: 2,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: '0x102000',
          toBlock: '0x102FFF',
          address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        },
      ],
      id: 3,
      jsonrpc: '2.0',
    },
  ]);

  const responseBody =
    '<html>\r\n<head><title>504 Gateway Time-out</title></head>\r\n' +
    '<body>\r\n<center><h1>504 Gateway Time-out</h1></center>\r\n' +
    '<hr><center>nginx/1.24.0</center>\r\n</body>\r\n</html>\r\n';

  const error = new Error(
    `bad response (status=504, headers={"content-type":"text/html","content-length":"${responseBody.length}","server":"nginx/1.24.0"}, body=${responseBody}, requestBody=${batchRequestBody}, requestMethod="POST", url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")`,
  );

  Object.assign(error, {
    reason: 'bad response',
    code: 'SERVER_ERROR',
    status: 504,
    headers: {
      'content-type': 'text/html',
      'content-length': String(responseBody.length),
      server: 'nginx/1.24.0',
      connection: 'keep-alive',
    },
    body: responseBody,
    requestBody: batchRequestBody,
    requestMethod: 'POST',
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 5e. Ethers SERVER_ERROR — batch/chunk, TCP disconnect while reading response (ECONNRESET)
//     Rare case: TCP connection was broken before the full HTTP response was received.
//     Unlike 5d (proxy timeout), the HTTP response was NOT received in full,
//     so body/status/headers are ABSENT.
//     serverError — a real Node.js Error from the socket with errno/syscall.
// ============================================================
export function createEthersServerErrorBatchConnReset(): Error {
  const batchRequestBody = JSON.stringify([
    {
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: '0x100000',
          toBlock: '0x100FFF',
          address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        },
      ],
      id: 1,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: '0x101000',
          toBlock: '0x101FFF',
          address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        },
      ],
      id: 2,
      jsonrpc: '2.0',
    },
    {
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: '0x102000',
          toBlock: '0x102FFF',
          address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        },
      ],
      id: 3,
      jsonrpc: '2.0',
    },
  ]);

  // serverError — a real Node.js Error from socket (not a plain object)
  const serverError = new Error('read ECONNRESET');
  Object.assign(serverError, {
    errno: -54, // macOS; on Linux it would be -104
    code: 'ECONNRESET',
    syscall: 'read',
  });

  const serverErrorCode = (serverError as Error & { code: string }).code;

  const error = new Error(
    `missing response (requestBody=${batchRequestBody}, requestMethod="POST", serverError=${JSON.stringify(
      { message: serverError.message, code: serverErrorCode },
    )}, url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")`,
  );

  Object.assign(error, {
    reason: 'missing response',
    code: 'SERVER_ERROR',
    requestBody: batchRequestBody,
    requestMethod: 'POST',
    serverError: serverError,
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 6. Ethers SERVER_ERROR — with nested serverError and response body
//    When the node returned HTTP 200 but the body contains a JSON-RPC error.
//    Ethers wraps this into SERVER_ERROR with body = the full response.
// ============================================================
export function createEthersServerErrorWithBody(): Error {
  const responseBody = JSON.stringify({
    jsonrpc: '2.0',
    id: 42,
    error: {
      code: -32005,
      message: 'limit exceeded',
      data: {
        rate: { allowed_rps: 10, backoff_seconds: 30, current_rps: 15.5 },
        see: 'https://infura.io/dashboard',
      },
    },
  });

  const error = new Error(
    `bad response (status=429, headers={"content-type":"application/json"}, body=${responseBody}, requestBody={"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3"}],"id":42,"jsonrpc":"2.0"}, requestMethod="POST", url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")`,
  );

  Object.assign(error, {
    reason: 'bad response',
    code: 'SERVER_ERROR',
    status: 429,
    headers: { 'content-type': 'application/json' },
    body: responseBody,
    requestBody:
      '{"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3"}],"id":42,"jsonrpc":"2.0"}',
    requestMethod: 'POST',
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 7. Ethers SERVER_ERROR — nested structure (serverError inside error)
//    Ethers can create errors with 2-3 levels of nesting.
//    This is checked in isEthersServerError() (common/errors.ts:108-116)
// ============================================================
export function createEthersNestedServerError(): Error {
  const innerServerError = new Error('gateway timeout');
  Object.assign(innerServerError, {
    code: 'SERVER_ERROR',
    status: 504,
    headers: { 'content-type': 'text/html' },
    body: '<html><body><h1>504 Gateway Time-out</h1></body></html>',
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  const middleError = new Error('processing response error');
  Object.assign(middleError, {
    code: 'SERVER_ERROR',
    serverError: innerServerError,
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  const outerError = new Error(
    'processing response error (requestBody={"method":"eth_getBlockByNumber","params":["latest",false],"id":1,"jsonrpc":"2.0"}, requestMethod="POST", url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")',
  );

  Object.assign(outerError, {
    reason: 'processing response error',
    code: 'SERVER_ERROR',
    error: middleError,
    requestBody:
      '{"method":"eth_getBlockByNumber","params":["latest",false],"id":1,"jsonrpc":"2.0"}',
    requestMethod: 'POST',
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return outerError;
}

// ============================================================
// 8. Ethers CALL_EXCEPTION (non-retryable)
//    Thrown by ethers on a failed eth_call (revert).
//    Caught in isNonRetryableError() and immediately thrown + logged.
// ============================================================
export function createEthersCallException(): Error {
  const error = new Error(
    'call revert exception; VM Exception while processing transaction: revert (method="balanceOf(address)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)',
  );

  Object.assign(error, {
    reason: null,
    code: 'CALL_EXCEPTION',
    method: 'balanceOf(address)',
    data: '0x',
    errorArgs: null,
    errorName: null,
    errorSignature: null,
    transaction: {
      from: '0x0000000000000000000000000000000000000000',
      to: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
      data: '0x70a08231000000000000000000000000d15a672319cf0352560ee76d9e89eab0889046d3',
      accessList: null,
    },
  });

  return error;
}

// ============================================================
// 9. Ethers TIMEOUT
//    Internal ethers timeout (not RequestTimeoutError).
//    Thrown from @ethersproject/web fetchJson.
// ============================================================
export function createEthersTimeoutError(): Error {
  const error = new Error(
    'timeout (requestBody={"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3","address":"0xae7ab96520de3a18e5e111b5eaab095312d7fe84"}],"id":42,"jsonrpc":"2.0"}, requestMethod="POST", timeout=120000, url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")',
  );

  Object.assign(error, {
    reason: 'timeout',
    code: 'TIMEOUT',
    requestBody:
      '{"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3","address":"0xae7ab96520de3a18e5e111b5eaab095312d7fe84"}],"id":42,"jsonrpc":"2.0"}',
    requestMethod: 'POST',
    timeout: 120000,
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}

// ============================================================
// 10. Ethers NETWORK_ERROR
//     When the provider is unreachable or DNS resolution fails.
// ============================================================
export function createEthersNetworkError(): Error {
  const error = new Error(
    'could not detect network (event="noNetwork", code=SERVER_ERROR, version=providers/5.7.2)',
  );

  Object.assign(error, {
    reason: 'could not detect network',
    code: 'NETWORK_ERROR',
    event: 'noNetwork',
  });

  return error;
}

// ============================================================
// 11. Native fetch/network Error
//     When the network connection breaks at the Node.js level.
//     Has no additional fields beyond the standard Error ones.
// ============================================================
export function createNativeNetworkError(): Error {
  const error = new Error('getaddrinfo ENOTFOUND mainnet.infura.io');
  Object.assign(error, {
    code: 'ENOTFOUND',
    errno: -3008,
    syscall: 'getaddrinfo',
    hostname: 'mainnet.infura.io',
  });
  return error;
}

// ============================================================
// 12. AllProvidersFailedError
//     Created in simple-fallback-json-rpc-batch-provider.ts:459-462
//     after exhausting all fallback providers.
//     cause = lastError (any of the errors above)
// ============================================================
export function createAllProvidersFailedError(): AllProvidersFailedError {
  const cause = createEthersServerError();

  const error = new AllProvidersFailedError(
    'All attempts to do ETH1 RPC request failed for eth_getLogs',
  );
  error.cause = cause;

  return error;
}

// ============================================================
// 13. Ethers SERVER_ERROR with huge body (fatal size error)
//     When eth_getLogs returned a huge response and then the request
//     failed — the entire payload ends up in the error's body field.
//     This is what causes fatal string allocation / OOM.
// ============================================================
export function createEthersServerErrorWithHugeBody(): Error {
  // Simulate an array of 10000 logs (~2.5MB JSON)
  const logs = Array.from({ length: 10000 }, (_, i) => ({
    address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    blockHash:
      '0x' + (0x131b79f + Math.floor(i / 100)).toString(16).padStart(64, '0'),
    blockNumber: '0x' + (0x131b79f + Math.floor(i / 100)).toString(16),
    data: '0x' + 'a'.repeat(256),
    logIndex: '0x' + i.toString(16),
    removed: false,
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000' + 'b'.repeat(40),
      '0x000000000000000000000000' + 'c'.repeat(40),
    ],
    transactionHash: '0x' + 'd'.repeat(64),
    transactionIndex: '0x' + (i % 200).toString(16),
  }));

  const responseBody = JSON.stringify({
    jsonrpc: '2.0',
    id: 42,
    error: {
      code: -32005,
      message: 'query returned more than 10000 results',
      data: { from: '0x131b79f', to: '0x131b7a3', results: logs },
    },
  });

  const error = new Error(
    `bad response (status=200, headers={"content-type":"application/json"}, body=<${responseBody.length} bytes>, requestBody={"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3","address":"0xae7ab96520de3a18e5e111b5eaab095312d7fe84"}],"id":42,"jsonrpc":"2.0"}, requestMethod="POST", url="https://mainnet.infura.io/v3/84842078b09946638c03157f83405213")`,
  );

  Object.assign(error, {
    reason: 'bad response',
    code: 'SERVER_ERROR',
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: responseBody,
    requestBody:
      '{"method":"eth_getLogs","params":[{"fromBlock":"0x131b79f","toBlock":"0x131b7a3","address":"0xae7ab96520de3a18e5e111b5eaab095312d7fe84"}],"id":42,"jsonrpc":"2.0"}',
    requestMethod: 'POST',
    url: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
  });

  return error;
}
