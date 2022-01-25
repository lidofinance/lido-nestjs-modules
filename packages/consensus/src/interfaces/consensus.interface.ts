/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { RequestInit } from 'node-fetch';
import { operations } from './generated.interface';

type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends Object
    ? T[K] extends Array<any>
      ? T[K]
      : KeysToCamelCase<T[K]>
    : T[K];
};

type ExtractPath<T> = T extends { parameters: { path: infer R } } ? R : unknown;
type ExtractQuery<T> = T extends { parameters: { query: infer R } }
  ? R
  : unknown;
type ExtractArgs<T> = KeysToCamelCase<ExtractPath<T> & ExtractQuery<T>>;

type ExtractResult<T> = T extends {
  responses: { 200: { content: { 'application/json': infer R } } };
}
  ? R
  : unknown;

export type ConsensusMethodArgs<T extends keyof operations> = ExtractArgs<
  operations[T]
> & { options?: RequestInit };

export type ConsensusMethodResult<T extends keyof operations> = Promise<
  ExtractResult<operations[T]>
>;
