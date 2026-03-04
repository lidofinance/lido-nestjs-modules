# RPC Metrics Prometheus

Prometheus metrics module for `@lido-nestjs/execution` RPC providers.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/rpc-metrics-prometheus
```

## Usage

### Root registration

```ts
import { Module } from '@nestjs/common';
import { FallbackProviderModule } from '@lido-nestjs/execution';
import { RpcMetricsPrometheusModule } from '@lido-nestjs/rpc-metrics-prometheus';

@Module({
  imports: [
    FallbackProviderModule.forRoot({
      urls: ['https://rpc.example.org'],
      network: 1,
    }),
    RpcMetricsPrometheusModule.forRoot({
      network: 'ethereum',
      layer: 'el',
      chainId: 1,
    }),
  ],
})
export class AppModule {}
```

### Feature registration with custom provider token

```ts
import { Module } from '@nestjs/common';
import { SimpleFallbackJsonRpcBatchProvider } from '@lido-nestjs/execution';
import { RpcMetricsPrometheusModule } from '@lido-nestjs/rpc-metrics-prometheus';

@Module({
  imports: [
    RpcMetricsPrometheusModule.forFeature({
      providerToken: SimpleFallbackJsonRpcBatchProvider,
      network: 'ethereum',
      layer: 'el',
      chainId: 1,
    }),
  ],
})
export class AppModule {}
```

## Compatibility Notes

- This module is event-driven and expects `rpc` events from
  `@lido-nestjs/execution` to contain `event.request` (JSON-RPC batch array).
  In compatibility mode for `@lido-nestjs/execution <= 1.19` (where
  `event.request` was removed), metric calculation degrades and runtime errors
  are expected because batch size, request key, and per-method labels cannot be
  derived.
- If `event.response` is absent on `provider:response-batched`, metrics are
  still emitted in best-effort mode:
  `http_rpc_response_payload_bytes` is skipped, and `rpc_request_total` is
  recorded as successful with empty `rpc_error_code`.
