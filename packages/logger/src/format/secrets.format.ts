import * as winston from 'winston';

export const cleanSecrets = winston.format(
  (info, opts: { secrets?: string[] }) => {
    const secrets = opts.secrets ?? [];

    info.message = secrets.reduce((result, secret) => {
      return secret ? result.replace(secret, '<removed>') : result;
    }, info.message);

    return info;
  },
);
