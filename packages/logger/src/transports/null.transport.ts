/* eslint-disable @typescript-eslint/no-explicit-any */
import * as winston from 'winston';

class NullTransport extends winston.transports.Console {
  constructor(opts?: any) {
    super(opts);

    this.name = 'NullTransport';
  }

  name: string;

  log(...args: any[]) {
    const callback = args[args.length - 1];
    callback();

    return this;
  }
}

export const nullTransport =
  (): winston.transports.ConsoleTransportInstance => {
    return new NullTransport();
  };
