# Library for storing keys in IPFS and creating merkle tree

Library provide interface for storing Node operator's key in IPFS and preparing merkle tree and proofs.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme).

## Install

```bash
yarn add @lido-nestjs/offchain-key-storage-client
```

## Ipfs

### Usage

This module depends on `IpfsModule` from `@lido-nestjs/ipfs-http-client`, so you need to provide it as a global module or import it into `IpfsNopKeysModule`.

### IpfsModule

// global IpfsModule usage

```ts
@Module({
  imports: [
    ConfigModule,
    // FetchModule.forRoot(),
    IpfsModule.forRootAsync({
      imports: [CustomFetchModule],
      async useFactory(config: ConfigService) {
        return {
          url: config.get('URL'),
          username: config.get('USERNAME'),
          password: config.get('PASSWORD'),
        };
      },
      inject: [ConfigService],
    }),
    IpfsNopKeysModule.forRoot(),
  ],
})
export class MyModule {}
```

// IpfsModule as deps of IpfsNopKeysModule

```ts
@Module({
  imports: [
    ConfigModule,
    // FetchModule.forRoot(),
    IpfsNopKeysModule.forRoot({
      imports: [
        IpfsModule.forRootAsync({
          imports: [CustomFetchModule],
          async useFactory(config: ConfigService) {
            return {
              url: config.get('URL'),
              username: config.get('USERNAME'),
              password: config.get('PASSWORD'),
            };
          },
          inject: [ConfigService],
        }),
      ],
    }),
  ],
})
export class MyModule {}
```

### NopMerkleTree

```ts
// Import
import { Module } from '@nestjs/common';
import { NopMerkleTreeModule } from '@lido-nestjs/offchain-key-storage-client';
import { MyService } from './my.service';

@Module({
  imports: [NopMerkleTreeModule],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import {
  NopMerkleTreeService,
  KeySignBuffer,
} from '@lido-nestjs/offchain-key-storage-client';

export class MyService {
  constructor(private nopMerkleTreeService: NopMerkleTreeService) {}

  myMethod(data: KeySignBuffer[]) {
    return this.nopMerkleTreeService.createTree(data);
  }
}
```

Example of usage this library https://github.com/lidofinance/lido-offchain-key-lib-test.git
