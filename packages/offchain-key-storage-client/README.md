# Library for storing keys in IPFS and creating merkle tree

Library provide interface for storing Node operator's key in IPFS and preparing merkle tree and proofs.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme).

## Install

```bash
yarn add @lido-nestjs/offchain-key-storage-client
```

## Ipfs

### Usage

This module depends on `FetchModule` from `@lido-nestjs/fetch`, so you need to provide it as a global module or import it into `IpfsModule`.

```ts
// Import
import { Module } from '@nestjs/common';
import { IpfsModule } from '@lido-nestjs/offchain-key-storage-client';
import { FetchModule } from '@lido-nestjs/fetch';
import { MyService } from './my.service';

@Module({
  imports: [IpfsModule.forFeature({ imports: [FetchModule] })],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { IpfsGeneralService } from '@lido-nestjs/offchain-key-storage-client';

export class MyService {
  constructor(private ipfsService: IpfsGeneralService) {}

  async myMethod() {
    return await this.ipfsService.get(
      'QmSJiSS956mnxk2UhWo5T7CqCebeDAS4BrnjuBM6VAeheT',
      'http://127.0.0.1:5001/api/v0',
    );
  }
}
```

### Global usage

```ts
import { Module } from '@nestjs/common';
import { IpfsModule } from '@lido-nestjs/offchain-key-storage-client';
import { FetchModule } from '@lido-nestjs/fetch';

@Module({
  imports: [FetchModule.forRoot(), IpfsModule.forRoot()],
})
export class MyModule {}
```

## NopMerkleTree

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
