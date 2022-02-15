import { RequestPolicy } from '../provider/extended-json-rpc-batch-provider';
import { ConnectionInfo } from '@ethersproject/web';
import { Networkish } from './networkish';
import { NonEmptyArray } from './non-empty-array';

export interface SimpleFallbackProviderConfig {
  urls: NonEmptyArray<ConnectionInfo | string>;

  network: Networkish;

  // common request police for all fallback providers
  requestPolicy?: RequestPolicy;

  // max retries and backoff max timeout before triggering the next provider
  maxRetries?: number;
  minBackoffMs?: number;
  maxBackoffMs?: number;

  // log retry attempts if needed
  logRetries?: boolean;
}
