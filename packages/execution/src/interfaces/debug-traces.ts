export type CallType = 'CALL' | 'DELEGATECALL' | 'STATICCALL';

export type TraceResultItem = {
  from: string;
  gas: string;
  gasUsed: string;
  to: string;
  input: string;
  type: string;
  value?: string;
  calls?: TraceResultItem[];
};

export type TraceResult = {
  txHash?: string;
  result: TraceResultItem;
};

export type TraceResponse = {
  id: number;
  jsonrpc: string;
  result: TraceResult[];
};

export type TraceConfig = {
  tracer: string;
  disableStorage: boolean;
  disableStack: boolean;
  enableMemory: boolean;
  enableReturnData: boolean;
};
