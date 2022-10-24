/* eslint-disable @typescript-eslint/no-explicit-any */
export type InterfaceTag<T> = {
  new (...args: unknown[]): T;
  readonly id: symbol;
  readonly interfaceTag: symbol;
};

export type InterfaceFromTag<T extends InterfaceTag<any>> =
  T extends InterfaceTag<infer Interface> ? Interface : never;
