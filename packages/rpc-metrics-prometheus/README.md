# RPC Metrics Prometheus

Prometheus RPC metrics for Lido NestJS projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

The module subscribes to provider `rpc` events from `@lido-nestjs/execution`
and registers Prometheus metrics in `prom-client`.

If `registry` is not provided, the module uses the default `prom-client`
registry.

## Install

```bash
yarn add @lido-nestjs/rpc-metrics-prometheus prom-client
```

## Usage

### Basic usage

```ts
import { Module } from '@nestjs/common';
import { LoggerModule } from '@lido-nestjs/logger';
import { FallbackProviderModule } from '@lido-nestjs/execution';
import { RpcMetricsModule } from '@lido-nestjs/rpc-metrics-prometheus';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    FallbackProviderModule.forRoot({
      urls: ['https://mainnet.example.org'],
      network: 1,
    }),
    RpcMetricsModule.forRoot({
      labels: {
        network: 'ethereum',
        layer: 'el',
        chainId: 1,
      },
    }),
  ],
})
export class AppModule {}
```

By default the module subscribes to `SimpleFallbackJsonRpcBatchProvider`.

### Extended provider usage

```ts
import { Module } from '@nestjs/common';
import {
  BatchProviderModule,
  ExtendedJsonRpcBatchProvider,
} from '@lido-nestjs/execution';
import { RpcMetricsModule } from '@lido-nestjs/rpc-metrics-prometheus';

@Module({
  imports: [
    BatchProviderModule.forRoot({
      url: 'https://mainnet.example.org',
      network: 1,
    }),
    RpcMetricsModule.forRoot({
      providerToken: ExtendedJsonRpcBatchProvider,
      labels: {
        network: 'ethereum',
        layer: 'el',
        chainId: 1,
      },
    }),
  ],
})
export class AppModule {}
```

### Async usage

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from './config';
import { RpcMetricsModule } from '@lido-nestjs/rpc-metrics-prometheus';

@Module({
  imports: [
    ConfigModule,
    RpcMetricsModule.forRootAsync({
      async useFactory(config: ConfigService) {
        return {
          labels: {
            network: config.network,
            layer: config.layer,
            chainId: config.chainId,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Custom registry usage

```ts
import { Module } from '@nestjs/common';
import { Registry } from 'prom-client';
import { RpcMetricsModule } from '@lido-nestjs/rpc-metrics-prometheus';

const registry = new Registry();

@Module({
  imports: [
    RpcMetricsModule.forRoot({
      labels: {
        network: 'ethereum',
        layer: 'el',
        chainId: 1,
      },
      registry,
    }),
  ],
})
export class AppModule {}
```

## Metrics

The module registers these metric families:

- `http_rpc_requests_total`
- `http_rpc_batch_size`
- `http_rpc_response_seconds`
- `http_rpc_request_payload_bytes`
- `http_rpc_response_payload_bytes`
- `rpc_request_total`

If any of these names are already present in the selected registry, the module
throws during application startup. This applies both to a custom registry and to
the default `prom-client` registry.
