import * as winston from 'winston';
import traverse from 'traverse';
import { LoggerCleanSecretsOptions } from '../interfaces';

export const SECRET_REPLACER = '<removed>';

export const regExpEscape = (str: string): string => {
  return str.replace(/[-[\]{}()*+?./\\^$|\s,]/g, '\\$&');
};

export const cleanSecrets = winston.format(
  (info, opts: LoggerCleanSecretsOptions) => {
    const secrets = opts.secrets ?? [];
    const regex = opts.regex ?? [];

    return replace(secrets, regex, info);
  },
);

const replace = <T extends unknown>(
  secrets: string[],
  regex: RegExp[],
  message: T,
  traversal = true,
): T => {
  if (typeof message === 'string') {
    const withCleanedSecrets = secrets.reduce((result, secret) => {
      const re = new RegExp(regExpEscape(secret), 'g');
      return secret ? result.replace(re, SECRET_REPLACER) : result;
    }, message);

    const withCleanedRegexes = regex.reduce((result, regex) => {
      const re = new RegExp(regex, 'g');
      return result.replace(re, SECRET_REPLACER);
    }, withCleanedSecrets);

    return withCleanedRegexes as T;
  }

  // Arrays are handled here as well
  if (typeof message === 'object' && message !== null && traversal === true) {
    return traverse(message).map(function (node) {
      if (this.level >= 10) {
        this.update('Maximum secret sanitizing depth reached.');
        this.stop();
        return;
      }
      // IMPORTANT: Specify no traversing on recursive reads
      this.update(replace(secrets, regex, node, false));
    }) as T;
  }

  return message;
};
