import { RequestInit as RequestInitSource, Response } from 'node-fetch';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
export { RequestInfo } from 'node-fetch';

export interface FetchModuleOptions {
  baseUrls?: string[];
  retryPolicy?: RequestRetryPolicy;
  middlewares?: MiddlewareCallback<Promise<Response>>[];
}

export interface RequestInit extends RequestInitSource {
  retryPolicy?: RequestRetryPolicy;
}

export interface RequestRetryPolicy {
  delay?: number;
  attempts?: number;
}
