import * as winston from 'winston';
import { LoggerCleanSecretsOptions } from '../interfaces';

export const SECRET_REPLACER = '<removed>';

export const cleanSecrets = winston.format(
  (info, opts: LoggerCleanSecretsOptions) => {
    const secrets = opts.secrets ?? [];

    info.message = replace(secrets, info.message);
    info.stack = replace(secrets, info.stack);

    return info;
  },
);

const replace = <T extends unknown>(secrets: string[], message: T): T => {
  if (typeof message === 'string') {
    return secrets.reduce((result, secret) => {
      const re = new RegExp(secret, 'g');
      return secret ? result.replace(re, SECRET_REPLACER) : result;
    }, message) as T;
  }

  if (Array.isArray(message)) {
    return message.map((item) => replace(secrets, item)) as T;
  }

  return message;
};
