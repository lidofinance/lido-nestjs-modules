# Library for storing keys in IPFS and creating merkle tree

Simple http ipfs client.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme).

## Install

```bash
yarn add @lido-nestjs/ipfs-http-client
```

## Ipfs

### Usage

This module depends on `FetchModule` from `@lido-nestjs/fetch`, so you need to provide it as a global module or import it into `IpfsModule`.

#### Sync usage

```ts
// Import
import { Module } from '@nestjs/common';
import { IpfsModule } from '@lido-nestjs/offchain-key-storage-client';
import { FetchModule } from '@lido-nestjs/fetch';
import { MyService } from './my.service';

@Module({
  imports: [
    IpfsModule.forFeature({
      imports: [FetchModule],
      url: 'http://127.0.0.1:5001/api/v0',
      username: 'username',
      password: 'password',
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Provider usage
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

### Async usage

```ts
@Module({
  imports: [
    ConfigModule,
    // FetchModule.forRoot(),
    IpfsModule.forFeatureAsync({
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
})
export class MyModule {}
```

### Global usage

```ts
import { Module } from '@nestjs/common';
import { IpfsModule } from '@lido-nestjs/offchain-key-storage-client';
import { FetchModule } from '@lido-nestjs/fetch';

@Module({
  imports: [
    IpfsModule.forRoot({
      imports: [FetchModule],
      url: 'http://127.0.0.1:5001/api/v0',
      username: 'username',
      password: 'password',
    }),

    // IpfsModule.forRootAsync({
    //   imports: [CustomFetchModule],
    //   async useFactory(config: ConfigService) {
    //     return {
    //       url: config.get('URL'),
    //       username: config.get('USERNAME'),
    //       password: config.get('PASSWORD'),
    //     };
    //   },
    //   inject: [ConfigService],
    // }),
  ],
})
export class MyModule {}
```

Example of usage this library https://github.com/lidofinance/lido-offchain-key-lib-test.git
