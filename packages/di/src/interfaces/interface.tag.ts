export type InterfaceTag<T> = {
  new (...args: unknown[]): T;
  readonly id: symbol;
  readonly interfaceTag: symbol;
};
