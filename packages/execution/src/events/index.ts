import { SimpleFallbackJsonRpcBatchProvider } from '../provider/simple-fallback-json-rpc-batch-provider';
import { AllProvidersFailedError } from '../error';
import {
  ExtendedJsonRpcBatchProvider,
  JsonRpcRequest,
  JsonRpcResponse,
} from '../provider/extended-json-rpc-batch-provider';

export type FallbackProviderRequestFailedAllEvent = {
  action: 'fallback-provider:request:failed:all';
  provider: SimpleFallbackJsonRpcBatchProvider;
  error: AllProvidersFailedError;
};

export type FallbackProviderRequestNonRetryableErrorEvent = {
  action: 'fallback-provider:request:non-retryable-error';
  provider: SimpleFallbackJsonRpcBatchProvider;
  error: Error | unknown;
};

export type FallbackProviderRequestEvent = {
  action: 'fallback-provider:request';
  provider: SimpleFallbackJsonRpcBatchProvider;
  activeFallbackProviderIndex: number;
  fallbackProvidersCount: number;
  domain: string;
  retryAttempt: number;
};

export type ProviderResponseBatchedErrorEvent = {
  action: 'provider:response-batched:error';
  error: Error;
  request: JsonRpcRequest[];
  provider: ExtendedJsonRpcBatchProvider;
  domain: string;
};

export type ProviderResponseBatchedEvent = {
  action: 'provider:response-batched';
  request: JsonRpcRequest[];
  response: JsonRpcResponse[] | JsonRpcResponse;
  provider: ExtendedJsonRpcBatchProvider;
  domain: string;
};

export type ProviderRequestBatchedEvent = {
  action: 'provider:request-batched';
  request: JsonRpcRequest[];
  provider: ExtendedJsonRpcBatchProvider;
  domain: string;
};

export type ProviderEvents =
  | ProviderRequestBatchedEvent
  | ProviderResponseBatchedEvent
  | ProviderResponseBatchedErrorEvent;

export type FallbackProviderEvents =
  | ProviderEvents
  | FallbackProviderRequestEvent
  | FallbackProviderRequestNonRetryableErrorEvent
  | FallbackProviderRequestFailedAllEvent;
