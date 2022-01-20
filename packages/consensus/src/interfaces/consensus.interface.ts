/* eslint-disable @typescript-eslint/ban-types */

import { RequestInit } from 'node-fetch';
import { operations } from './generated.interface';
import { ConsensusService } from '../service';

type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends {}
    ? KeysToCamelCase<T[K]>
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

export interface ConsensusMethod<T extends keyof operations> {
  (
    this: ConsensusService,
    args?: ExtractArgs<operations[T]> & { options?: RequestInit },
  ): Promise<ExtractResult<operations[T]>>;
}
