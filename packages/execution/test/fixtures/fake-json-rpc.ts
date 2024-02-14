/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConnectionInfo } from '@ethersproject/web';
import { NonEmptyArray } from '../../src/interfaces/non-empty-array';
import { BigNumber } from '@ethersproject/bignumber';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: NonEmptyArray<unknown>;
  id: number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result: unknown;
}

const block = {
  difficulty: '0x8b5504a130',
  extraData: '0x476574682f76312e302e302f77696e646f77732f676f312e342e32',
  gasLimit: '0x1388',
  gasUsed: '0x0',
  hash: '0xdc2d938e4cd0a149681e9e04352953ef5ab399d59bcd5b0357f6c0797470a524',
  logsBloom: '0x0',
  miner: '0xbf71642d7cbae8faf1cfdc6c1c48fcb45b15ed22',
  mixHash: '0xc6bf383db032101cc2101543db260602b709e5d9e38444bb71b680777185448b',
  nonce: '0xb75e5f372524d34c',
  number: '0x2710',
  parentHash:
    '0xb9ecd2df84ee2687efc0886f5177f6674bad9aeb73de9323e254e15c5a34fc93',
  receiptsRoot:
    '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
  sha3Uncles:
    '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
  size: '0x21d',
  stateRoot:
    '0x4de830f589266773eae1a1caa88d75def3f3a321fbd9aeb89570a57c6e7f3dbb',
  timestamp: '0x55bb3ea3',
  totalDifficulty: '0x82f427b38eae1',
  transactions: [],
  transactionsRoot:
    '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
  uncles: [],
};

export const fixtures = {
  address: '0x4329419C7aF27A622C7004b9d3C8B90d3be8c54f',
  block: {
    hash: '0xf6497754297b60741c3fa66fc8f75b21e4e278c69533c0a486572763062141a9',
    number: 14223886,
    numberHex: '0xD90A0E', // the same as 14223886
  },
  eth_chainId: '0x1',
  eth_getBalance: {
    latest: '0x01',
    default_blockHash: '0x02',
    default_blockNumber: '0x02',
    default_blockNumberHex: '0x02',
    eip1898_blockNumber: '0x03',
    eip1898_blockHash: '0x04',
  },
  eth_getBlockByNumber: {
    default: block,
  },
};

export const fakeJsonRpc =
  (
    chainId?: string,
    blockNumber?: string,
    blockHash?: string,
    txHash?: string,
    feeHistory?: any,
  ) =>
  (request: JsonRpcRequest): JsonRpcResponse => {
    switch (request.method) {
      case 'eth_chainId':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: chainId ?? fixtures.eth_chainId,
        };
      case 'eth_getBalance':
        if (
          Array.isArray(request.params) &&
          typeof request.params[1] === 'object'
        ) {
          if (typeof (<any>request.params[1]).blockHash === 'string') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: fixtures.eth_getBalance.eip1898_blockHash,
            };
          }

          if (typeof (<any>request.params[1]).blockNumber === 'string') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: fixtures.eth_getBalance.eip1898_blockNumber,
            };
          }
        }

        if (
          Array.isArray(request.params) &&
          typeof request.params[1] === 'string' &&
          request.params[1] === 'latest'
        ) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: fixtures.eth_getBalance.latest,
          };
        }

        if (
          Array.isArray(request.params) &&
          typeof request.params[1] === 'string'
        ) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: fixtures.eth_getBalance.default_blockNumberHex,
          };
        }

        return {
          jsonrpc: '2.0',
          id: request.id,
          result: fixtures.eth_getBalance.latest,
        };
      case 'eth_getBlockByHash':
      case 'eth_getBlockByNumber':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            ...fixtures.eth_getBlockByNumber.default,
            number: blockNumber ?? fixtures.eth_getBlockByNumber.default.number,
            hash: blockHash ?? fixtures.eth_getBlockByNumber.default.hash,
          },
        };
      case 'eth_blockNumber':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x2710',
        };
      case 'eth_gasPrice':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x1dfd14000', // 8049999872 Wei
        };
      case 'eth_estimateGas':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x5208', // 21000
        };
      case 'eth_sendRawTransaction':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result:
            txHash ??
            '0xbdbda178dac948c2ff214526717069e4f4aaf8a550bd0335bfa2235412403489',
        };
      case 'eth_feeHistory':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result:
            typeof feeHistory === 'undefined'
              ? {
                  baseFeePerGas: [
                    '0x10ef1681f4',
                    '0x130ce4a72e',
                    '0x121f7cb0ce',
                    '0x12be0e9af1',
                  ],
                  gasUsedRatio: [
                    0.9999255060047089, 0.30528086666666665, 0.6367133494142969,
                  ],
                  oldestBlock: '0xdf9f65',
                  reward: [
                    ['0x59682f00', '0x59682f00', '0x59682f00'],
                    ['0x3b9aca00', '0x3b9aca00', '0x3b9aca00'],
                    ['0x3b9aca00', '0x3b9aca00', '0x59682f00'],
                  ],
                }
              : feeHistory,
        };
      case 'debug_traceBlockByHash':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: [
            {
              result: {
                from: '0x1110f5b97703d14ac3de91bdcd12cd4566ae48d5',
                gas: '0x51638',
                gasUsed: '0x1a949',
                to: '0x000000d40b595b94918a28b27d1e2c66f43a51d3',
                input:
                  '0x153224a791e2880efc6f0f47ece0f957f83a936b2199f9209e1c9d',
                calls: [
                  {
                    from: '0x000000d40b595b94918a28b27d1e2c66f43a51d3',
                    gas: '0x4b49b',
                    gasUsed: '0x6158',
                    to: '0xa791e2880efc6f0f47ece0f957f83a936b2199f9',
                    input: '0x022c0d',
                    calls: [
                      {
                        from: '0xa791e2880efc6f0f47ece0f957f83a936b2199f9',
                        gas: '0x48f0a',
                        gasUsed: '0x229e',
                        to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        input: '0xa9059cbb',
                        output: '0x0000',
                        value: '0x0',
                        type: 'CALL',
                      },
                    ],
                    value: '0x0',
                    type: 'CALL',
                  },
                ],
                value: '0xaf69258a00',
                type: 'CALL',
              },
            },
            {
              result: {
                from: '0xe667c544b38ca7305d95c985ff7a4571aca88d0c',
                gas: '0x0',
                gasUsed: '0x5208',
                to: '0xe10d810190ae3654cefb0061fed0f91e36fdde86',
                input: '0x',
                value: '0x2f2e16f29e0000',
                type: 'CALL',
              },
            },
          ],
        };
      default:
        return { jsonrpc: '2.0', id: request.id, result: {} };
    }
  };

export const fakeFetchImpl =
  (
    chainId?: number,
    blockNumber?: number,
    blockHash?: string,
    txHash?: string,
    feeHistory?: any,
  ) =>
  async (
    connection: string | ConnectionInfo,
    json?: string,
  ): Promise<unknown> => {
    const requests = json ? JSON.parse(json) : {};
    return requests.map(
      fakeJsonRpc(
        chainId ? BigNumber.from(chainId).toHexString() : undefined,
        blockNumber ? BigNumber.from(blockNumber).toHexString() : undefined,
        blockHash,
        txHash,
        feeHistory,
      ),
    );
  };

export const fakeFetchImplThatCantDo =
  (methods: string[]) =>
  async (
    connection: string | ConnectionInfo,
    json?: string,
  ): Promise<unknown> => {
    const requests = json ? JSON.parse(json) : {};

    const results = requests.map((request: JsonRpcRequest) => {
      if (!methods.includes(request.method)) {
        return fakeJsonRpc()(request);
      }
      return null;
    });

    if (results.filter((r: JsonRpcResponse | null) => r === null).length > 0) {
      throw new Error("Can't do a method");
    }

    return results;
  };

export const fakeFetchImplThatCanOnlyDoNetworkDetection = async (
  connection: string | ConnectionInfo,
  json?: string,
): Promise<unknown> => {
  const requests = json ? JSON.parse(json) : {};

  const results = requests.map((request: JsonRpcRequest) => {
    if (request.method === 'eth_chainId') {
      return fakeJsonRpc()(request);
    }
    return null;
  });

  if (results.filter((r: JsonRpcResponse | null) => r === null).length > 0) {
    throw new Error('Some error');
  }

  return results;
};

export const makeFakeFetchImplThrowsError = (error: Error) => {
  return async (): Promise<unknown> => {
    throw error;
  };
};

export const makeFakeFetchImplReturnsNull = () => {
  return async (): Promise<unknown> => {
    return null;
  };
};

export const fakeFetchImplThatAlwaysFails = async (): Promise<never> => {
  throw new Error('Always fail');
};

export const makeFakeFetchImplThatFailsAfterNRequests = (
  firstNSuccessfulRequests: number,
  chainId: number,
  blockNumber: number,
) => {
  let counter = 0;

  return async (
    connection: string | ConnectionInfo,
    json?: string,
  ): Promise<unknown> => {
    if (counter++ >= firstNSuccessfulRequests) {
      throw new Error('Failure');
    }
    const requests = json ? JSON.parse(json) : {};
    return requests.map(
      fakeJsonRpc(
        BigNumber.from(chainId).toHexString(),
        BigNumber.from(blockNumber).toHexString(),
      ),
    );
  };
};

export const makeFakeFetchImplThatFailsFirstNRequests = (
  firstNFailedRequests: number,
  chainId: number,
  blockNumber: number,
) => {
  let counter = firstNFailedRequests;

  return async (
    connection: string | ConnectionInfo,
    json?: string,
  ): Promise<unknown> => {
    if (counter-- > 0) {
      throw new Error('Failure');
    }
    const requests = json ? JSON.parse(json) : {};
    return requests.map(
      fakeJsonRpc(
        BigNumber.from(chainId).toHexString(),
        BigNumber.from(blockNumber).toHexString(),
      ),
    );
  };
};

export const makeFetchImplWithSpecificNetwork = (chainId: number) => {
  return fakeFetchImpl(chainId);
};

export const makeFetchImplWithSpecificFeeHistory = (feeHistory: any) => {
  return fakeFetchImpl(undefined, undefined, undefined, undefined, feeHistory);
};
