import { Abstract, ModuleMetadata, Type } from '@nestjs/common';
import { Registry } from 'prom-client';

export type RpcMetricsProviderToken =
  | string
  | symbol
  | Type<unknown>
  | Abstract<unknown>;

export interface RpcMetricsPrometheusBaseOptions {
  network: string;
  layer: string;
  chainId: string | number;
  registry?: Registry;
}

export interface RpcMetricsPrometheusOptions
  extends RpcMetricsPrometheusBaseOptions {}

export interface RpcMetricsPrometheusFeatureOptions
  extends RpcMetricsPrometheusBaseOptions {
  providerToken: RpcMetricsProviderToken;
}

export interface RpcMetricsPrometheusAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  useFactory: (
    ...args: never[]
  ) => Promise<RpcMetricsPrometheusOptions> | RpcMetricsPrometheusOptions;
  inject?: RpcMetricsProviderToken[];
}

export interface RpcMetricsPrometheusFeatureAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  providerToken: RpcMetricsProviderToken;
  useFactory: (
    ...args: never[]
  ) =>
    | Promise<RpcMetricsPrometheusBaseOptions>
    | RpcMetricsPrometheusBaseOptions;
  inject?: RpcMetricsProviderToken[];
}
