/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestInit as RequestInitSource, Response } from 'node-fetch';
import { ModuleMetadata } from '@nestjs/common';
import { MiddlewareCallback } from '@lido-nestjs/middleware';
export { RequestInfo } from 'node-fetch';

type Cb<P> = (payload: P) => Cb<P>;

type LocalPayload = {
  response: Response;
  data: unknown;
};

export interface FetchModuleOptions {
  baseUrls?: string[];
  retryPolicy?: RequestRetryPolicy;
  middlewares?: MiddlewareCallback<Promise<Cb<LocalPayload>>, LocalPayload>[];
}

export interface RequestInit<Payload extends object = never>
  extends RequestInitSource {
  retryPolicy?: RequestRetryPolicy;
  middlewares?: MiddlewareCallback<Promise<Cb<Payload>>, LocalPayload>[];
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
  init?: RequestInit,
) => Promise<T>;
