import * as winston from 'winston';
import { cleanSecrets } from './secrets.format';
import { LoggerJSONFormatOptions } from '../interfaces';

export const json = (
  options: LoggerJSONFormatOptions = {},
): winston.Logform.Format => {
  const { secrets, regex } = options;

  return winston.format.combine(
    cleanSecrets({ secrets, regex }),
    winston.format.json(),
  );
};
