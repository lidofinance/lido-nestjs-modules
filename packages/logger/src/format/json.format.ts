import * as winston from 'winston';
import { cleanSecrets } from './secrets.format';
import { LoggerJSONFormatOptions } from '../interfaces';

export const json = (
  options: LoggerJSONFormatOptions = {},
): winston.Logform.Format => {
  const { secrets, regex } = options;

  return options.timestamp === true
    ? winston.format.combine(
        cleanSecrets({ secrets, regex }),
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.json(),
      )
    : winston.format.combine(
        cleanSecrets({ secrets, regex }),
        winston.format.json(),
      );
};
