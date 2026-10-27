import * as winston from 'winston';
import { cleanSecrets } from './secrets.format';
import { omitErrorField } from './error-field.format';
import { LoggerJSONFormatOptions } from '../interfaces';

export const json = (
  options: LoggerJSONFormatOptions = {},
): winston.Logform.Format => {
  const { secrets, regex, includeErrorField = false } = options;

  return winston.format.combine(
    ...(includeErrorField ? [] : [omitErrorField()]),
    cleanSecrets({ secrets, regex }),
    winston.format.json(),
  );
};
