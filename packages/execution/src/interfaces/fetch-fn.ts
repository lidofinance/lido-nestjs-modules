export interface FetchRequestParams {
  url: string;
  body: string;
}

export interface FetchResponse {
  data: unknown;
}

export type FetchFn = (params: FetchRequestParams) => Promise<FetchResponse>;
