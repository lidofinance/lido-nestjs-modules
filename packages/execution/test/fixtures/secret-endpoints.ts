// Fake keys in the shapes RPC providers hand out: [name, url, key]
export const secretEndpoints: [string, string, string][] = [
  [
    'alchemy',
    'https://eth-mainnet.g.alchemy.com/v2/AlchFAKEk3yQ9xZ2mN7pL4wR8tY1uV',
    'AlchFAKEk3yQ9xZ2mN7pL4wR8tY1uV',
  ],
  [
    'infura',
    'https://mainnet.infura.io/v3/9f1e2d3c4b5a69788776655443322110',
    '9f1e2d3c4b5a69788776655443322110',
  ],
  [
    'drpc query',
    'https://lb.drpc.org/ogrpc?network=ethereum&dkey=DrpcFAKEdkeyAbCdEfGhIjKlMnOp',
    'DrpcFAKEdkeyAbCdEfGhIjKlMnOp',
  ],
  [
    'drpc path',
    'https://lb.drpc.live/ethereum/DrpcFAKEpathKeyQrStUvWxYz012',
    'DrpcFAKEpathKeyQrStUvWxYz012',
  ],
  [
    'chainstack',
    'https://ethereum-mainnet.core.chainstack.com/c0ffeec0ffeec0ffeec0ffeec0ffee12',
    'c0ffeec0ffeec0ffeec0ffeec0ffee12',
  ],
  [
    'quicknode',
    'https://fake-name.quiknode.pro/qnFAKEtokenaabbccddeeff00112233/',
    'qnFAKEtokenaabbccddeeff00112233',
  ],
  [
    'ankr',
    'https://rpc.ankr.com/eth/ankrFAKE0123456789abcdef0123456789abcdef',
    'ankrFAKE0123456789abcdef0123456789abcdef',
  ],
  [
    'blast',
    'https://eth-mainnet.blastapi.io/5a5a5a5a-FAKE-4b4b-8c8c-0d0d0d0d0d0d',
    '5a5a5a5a-FAKE-4b4b-8c8c-0d0d0d0d0d0d',
  ],
  [
    'userinfo',
    'https://rpcuser:Passw0rdFAKEsecret@rpc.example.com/',
    'Passw0rdFAKEsecret',
  ],
  [
    'ankr beacon',
    'https://rpc.ankr.com/premium-http/eth_beacon/ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12/eth/v1/node/health',
    'ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12',
  ],
  [
    'blockdaemon',
    'https://svc.blockdaemon.com/ethereum/mainnet/native?apiKey=bdFAKEapiKeyZyXwVuTsRqPoNm98',
    'bdFAKEapiKeyZyXwVuTsRqPoNm98',
  ],
  [
    'infura secret',
    'https://:InfuraFAKEsecretAbCdEf123456@mainnet.infura.io/v3/9f1e2d3c4b5a69788776655443322110',
    'InfuraFAKEsecretAbCdEf123456',
  ],
];

// Every substring of the key at least `size` chars long
export const keyPieces = (key: string, size = 8): string[] => {
  const pieces: string[] = [];
  for (let i = 0; i + size <= key.length; i++) {
    pieces.push(key.slice(i, i + size));
  }
  return pieces;
};

export const findPiece = (text: string, key: string, size = 8) =>
  keyPieces(key, size).find((piece) => text.includes(piece));
