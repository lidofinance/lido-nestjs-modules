import { ExtendedJsonRpcBatchProvider } from '../provider/extended-json-rpc-batch-provider';
import { Network } from '@ethersproject/networks';

export interface FallbackProvider {
  valid: boolean;
  provider: ExtendedJsonRpcBatchProvider;
  network: Network | null;
  index: number;
}
