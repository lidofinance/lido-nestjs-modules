/* eslint-disable @typescript-eslint/no-explicit-any */
export type Int = number;

export type WithdrawalCredentialsHex = string;
export type WithdrawalCredentialsBuffer = Buffer;

export type PossibleWC = {
  currentWC: [WithdrawalCredentialsHex, WithdrawalCredentialsBuffer];
  previousWC: [WithdrawalCredentialsHex, WithdrawalCredentialsBuffer][];
};

export type Promisified<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

export type PromisifiedMethods<T> = {
  [P in keyof T]: T[P] extends (...args: any) => any ? Promisified<T[P]> : T[P];
};
