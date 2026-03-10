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
import { FallbackProviderModule } from '@lido-nestjs/execution';
import { MyService } from './my.service';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    FallbackProviderModule.forRoot({
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

```ts
import { Module } from '@nestjs/common';
import { FallbackProviderModule } from '@lido-nestjs/execution';
import { ConfigModule, ConfigService } from './my.service';

@Module({
  imports: [
    ConfigModule.forRoot(), // exports ConfigService
    FetchModule.forRoot(),
    FallbackProviderModule.forRootAsync({
      async useFactory(configService: ConfigService) {
        return {
          urls: configService.urls,
          network: configService.network,
        };
      },
      inject: [ConfigService],
    }),
  ],
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

### Custom `fetchFn`

`fetchFn` is available in both `FallbackProviderModule` and
`BatchProviderModule`. A convenient pattern is to keep HTTP transport details
in a separate Nest module and inject that module into `forRootAsync()`.

#### Example: Node.js built-in `fetch`

This is the simplest option for Node.js 18+.

```ts
import { Injectable, Module } from '@nestjs/common';
import { FallbackProviderModule, FetchFn } from '@lido-nestjs/execution';

@Module({
  imports: [
    FallbackProviderModule.forRootAsync({
      useFactory: () => ({
        urls: ['https://mainnet.example.org'],
        network: 1,
        fetchFn: async ({ url, body }) => {
          const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
          });

          if (!respone.ok) {
            throw new Error(`Bad response ${response.statusCode}`);
          }

          const data = await response.json();

          return { data };
        },
      }),
    }),
  ],
})
export class MyApp {}
```

#### Example: `undici.request()` with a dedicated `Agent`

For Ethereum JSON-RPC it is usually better to keep one long-lived `Agent` per
application context instead of creating a new client per request.

```ts
import {
  Injectable,
  Module,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { LoggerModule } from '@lido-nestjs/logger';
import { FallbackProviderModule, FetchFn } from '@lido-nestjs/execution';
import { Agent, interceptors } from 'undici';

const { dns, retry, redirect, decompress } = interceptors;

@Injectable()
export class UndiciExecutionTransport implements OnModuleInit, OnModuleDestroy {
  private agent: Agent;

  public async onModuleInit(): Promise<void> {
    this.agent = new Agent({
      connections: 100,
      headersTimeout: 10_000,
      bodyTimeout: 10_000,
    }).compose(dns(), retry(), redirect(), decompress());
  }

  public async onModuleDestroy(): Promise<void> {
    await this.agent.close();
  }

  public readonly fetchFn: FetchFn = async ({ url, body }) => {
    const startedAt = Date.now();

    const response = await this.agent.request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body,
    });

    const text = await response.body.text();

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `Execution RPC request failed: ${response.statusCode} ${text}`,
      );
    }

    return {
      data: JSON.parse(text),
      metrics: {
        durationMs: Date.now() - startedAt,
        payloadLengthBytes: Buffer.byteLength(body),
        responseLengthBytes: Buffer.byteLength(text),
        statusCode: response.statusCode,
      },
    };
  };
}

@Module({
  providers: [UndiciExecutionTransport],
  exports: [UndiciExecutionTransport],
})
export class UndiciExecutionTransportModule {}

@Module({
  imports: [
    UndiciExecutionTransportModule,
    FallbackProviderModule.forRootAsync({
      imports: [UndiciExecutionTransportModule],
      inject: [UndiciExecutionTransport],
      useFactory: (transport: UndiciExecutionTransport) => ({
        urls: ['https://mainnet.example.org'],
        network: 1,
        fetchFn: transport.fetchFn,
      }),
    }),
  ],
})
export class MyApp {}
```
