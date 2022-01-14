import * as winston from 'winston';
import { json } from '../format';

export const jsonTransport = (
  ...args: Parameters<typeof json>
): winston.transports.ConsoleTransportInstance => {
  return new winston.transports.Console({ format: json(...args) });
};
