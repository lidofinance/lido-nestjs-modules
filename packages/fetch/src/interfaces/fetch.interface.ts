/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestInit as RequestInitSource, Response } from 'node-fetch';
import { ModuleMetadata } from '@nestjs/common';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
export { RequestInfo } from 'node-fetch';

export interface FetchModuleOptions {
  baseUrls?: string[];
  retryPolicy?: RequestRetryPolicy;
  middlewares?: MiddlewareCallback<Promise<unknown>>[];
}

export interface RequestInit<Opts> extends RequestInitSource {
  retryPolicy?: RequestRetryPolicy;
  serializer?: (response: Opts) => Promise<Opts>;
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

export type ResponseSerializer<T> = (
  response: Response,
  init?: RequestInit<T>,
) => Promise<T>;
