import { RequestInit as RequestInitSource } from 'node-fetch';
export { RequestInfo } from 'node-fetch';

export interface FetchModuleOptions {
  baseUrl?: string;
  retryPolicy?: RequestRetryPolicy;
}

export interface RequestInit extends RequestInitSource {
  retryPolicy?: RequestRetryPolicy;
}

export interface RequestRetryPolicy {
  delay?: number;
  count?: number;
  fallbackBaseUrls?: string[];
}
