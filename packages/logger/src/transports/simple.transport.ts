import * as winston from 'winston';
import { simple } from '../format';

export const simpleTransport = (
  ...args: Parameters<typeof simple>
): winston.transports.ConsoleTransportInstance => {
  return new winston.transports.Console({ format: simple(...args) });
};
