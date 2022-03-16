/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConnectionInfo } from '@ethersproject/web';
import { NonEmptyArray } from '../../dist/interfaces/non-empty-array';
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
  (chainId?: string, blockNumber?: string, blockHash?: string) =>
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
      default:
        return { jsonrpc: '2.0', id: request.id, result: {} };
    }
  };

export const fakeFetchImpl =
  (chainId?: number, blockNumber?: number, blockHash?: string) =>
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
      ),
    );
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
