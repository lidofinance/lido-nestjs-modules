import { ExtendedJsonRpcBatchProviderEventEmitter } from '@lido-nestjs/execution';

export type MetricResult = 'success' | 'fail';

export interface BaseMetricLabels {
  network: string;
  layer: string;
  chain_id: string;
  provider: string;
}

export interface RpcProviderWithEventEmitter {
  eventEmitter: ExtendedJsonRpcBatchProviderEventEmitter;
}
