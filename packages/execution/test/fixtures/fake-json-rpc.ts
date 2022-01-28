/* eslint-disable @typescript-eslint/no-explicit-any */

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: [unknown];
  id: number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result: unknown;
}

export function fakeJsonRpc(request: JsonRpcRequest): JsonRpcResponse {
  switch (request.method) {
    case 'eth_chainId':
      return { jsonrpc: '2.0', id: request.id, result: '0x1' };
    case 'eth_getBlockByNumber':
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          difficulty: '0x8b5504a130',
          extraData: '0x476574682f76312e302e302f77696e646f77732f676f312e342e32',
          gasLimit: '0x1388',
          gasUsed: '0x0',
          hash: '0xdc2d938e4cd0a149681e9e04352953ef5ab399d59bcd5b0357f6c0797470a524',
          logsBloom: '0x0',
          miner: '0xbf71642d7cbae8faf1cfdc6c1c48fcb45b15ed22',
          mixHash:
            '0xc6bf383db032101cc2101543db260602b709e5d9e38444bb71b680777185448b',
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
        },
      };
    default:
      return { jsonrpc: '2.0', id: request.id, result: {} };
  }
}
