import * as winston from 'winston';

// nest-winston >= 1.9.2 adds the logged Error to the log as the `error` field
export const omitErrorField = winston.format((info) => {
  const { error, message } = info;

  if (error instanceof Error && error.message === message) {
    delete info.error;
  }

  return info;
});
