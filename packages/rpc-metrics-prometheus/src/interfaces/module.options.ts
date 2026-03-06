/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { Registry } from 'prom-client';

export interface RpcMetricsLabels {
  network: string;
  layer: string;
  chainId: string | number;
}

export type RpcMetricsProviderToken =
  | string
  | symbol
  | (new (...args: never[]) => unknown);

export interface RpcMetricsModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  providerToken?: RpcMetricsProviderToken;
  labels: RpcMetricsLabels;
  registry?: Registry;
}

export interface RpcMetricsModuleResolvedOptions {
  providerToken: RpcMetricsProviderToken;
  labels: RpcMetricsLabels;
  registry?: Registry;
}

export interface RpcMetricsModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  providerToken?: RpcMetricsProviderToken;
  useFactory: (
    ...args: any[]
  ) =>
    | Promise<Pick<RpcMetricsModuleSyncOptions, 'labels' | 'registry'>>
    | Pick<RpcMetricsModuleSyncOptions, 'labels' | 'registry'>;
  inject: any[];
}
