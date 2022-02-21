# Execution layer (Eth1 RPC Provider)

NestJS Logger for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/execution
```

## Usage

### Basic usage

```ts
// Import
import { Injectable, Module } from '@nestjs/common';
import { ExecutionModule } from '@lido-nestjs/execution';
import { MyService } from './my.service';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    ExecutionModule.forRoot({
      imports: [],
      urls: ['http://localhost:8545', 'http://fallback:8545'],
      network: 1,
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { SimpleFallbackJsonRpcBatchProvider } from '@lido-nestjs/execution';

@Injectable
export class MyService {
  constructor(private provider: SimpleFallbackJsonRpcBatchProvider) {}

  async doSomeWork() {
    return await this.provider.getBlock(1000);
  }
}
```

### Async usage

// TODO
