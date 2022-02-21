export const EXECUTION_MODULE_OPTIONS = Symbol('execution-module-options');

export enum Provider {
  ExtendedJsonRpcBatchProvider,
  SimpleFallbackJsonRpcBatchProvider,
}

// export type Providers =
//   [Provider.ExtendedJsonRpcBatchProvider, Provider.SimpleFallbackJsonRpcBatchProvider] |
//   [Provider.SimpleFallbackJsonRpcBatchProvider, Provider.ExtendedJsonRpcBatchProvider] |
//   [Provider.SimpleFallbackJsonRpcBatchProvider] |
//   [Provider.ExtendedJsonRpcBatchProvider];
