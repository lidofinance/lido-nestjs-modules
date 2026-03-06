export interface FetchRequestParams {
  url: string;
  body: string;
}

export interface FetchResponse {
  data: unknown;
  metrics?: FetchMetrics;
}

export interface FetchMetrics {
  durationMs: number;
  payloadLengthBytes: number;
  responseLengthBytes?: number;
  statusCode?: number;
}

export type FetchFn = (params: FetchRequestParams) => Promise<FetchResponse>;
