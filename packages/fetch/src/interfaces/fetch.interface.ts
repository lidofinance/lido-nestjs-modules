/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RequestInit as RequestInitSource,
  Response,
} from '@lido-js/node-fetch-cjs';
import { ModuleMetadata } from '@nestjs/common';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
export { RequestInfo } from '@lido-js/node-fetch-cjs';

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

export interface FetchModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<FetchModuleOptions>;
  inject?: any[];
}
