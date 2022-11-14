import * as winston from 'winston';
import { LoggerCleanSecretsOptions } from '../interfaces';

export const SECRET_REPLACER = '<removed>';

export const regExpEscape = (str: string): string => {
  return str.replace(/[-[\]{}()*+?./\\^$|\s,]/g, '\\$&');
};

export const cleanSecrets = winston.format(
  (info, opts: LoggerCleanSecretsOptions) => {
    const secrets = opts.secrets ?? [];
    const regex = opts.regex ?? [];

    info.message = replace(secrets, regex, info.message);
    info.stack = replace(secrets, regex, info.stack);

    return info;
  },
);

const replace = <T extends unknown>(
  secrets: string[],
  regex: RegExp[],
  message: T,
): T => {
  if (typeof message === 'string') {
    const withCleanedSecrets = secrets.reduce((result, secret) => {
      const re = new RegExp(regExpEscape(secret), 'g');
      return secret ? result.replace(re, SECRET_REPLACER) : result;
    }, message);

    const withCleanedRegexes = regex.reduce((result, regex) => {
      const re = new RegExp(regex, 'g');
      return regex ? result.replace(re, SECRET_REPLACER) : result;
    }, withCleanedSecrets);

    return withCleanedRegexes as T;
  }

  if (Array.isArray(message)) {
    return message.map((item) => replace(secrets, regex, item)) as T;
  }

  return message;
};
