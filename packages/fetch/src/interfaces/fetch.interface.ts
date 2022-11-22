/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Request,
  RequestInit as RequestInitSource,
  Response,
} from '@lido-js/node-fetch-cjs';
import { ModuleMetadata } from '@nestjs/common';
import { MiddlewareCallback } from '@lido-nestjs/middleware';

export interface FetchModuleOptions {
  baseUrls?: string[];
  retryPolicy?: RequestRetryPolicy;
  middlewares?: MiddlewareCallback<Promise<Response>>[];
}

interface URLLike {
  href: string;
}
// node-fetch v3 lose the naive polyfill URLLike
// I add it in the fetch interface
// The reason is TS can't handle abstraction with .toString getter
// toke from here: // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/39c90291062b269d2c4f19ca7d65369c210696aa/types/node-fetch/index.d.ts#L198
// issue: https://github.com/node-fetch/node-fetch/issues/1261
export type RequestInfo = string | URLLike | Request;
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
