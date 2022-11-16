import * as winston from 'winston';
import { cleanSecrets } from './secrets.format';
import { LoggerSimpleFormatOptions } from '../interfaces';

const colorizer = winston.format.colorize();

const getMeta = (
  fieldColors: winston.config.AbstractConfigSetColors,
  log: winston.Logform.TransformableInfo,
): string | null => {
  const fieldNames = Object.keys(fieldColors);
  const metaString = fieldNames
    .map((key) => [key, log[key]])
    .filter(([, value]) => value != null)
    .map(([key, value]) => colorizer.colorize(key, value))
    .join(' ');

  return metaString ? `[${metaString}]` : null;
};

export const simple = (
  options: LoggerSimpleFormatOptions = {},
): winston.Logform.Format => {
  const { secrets, regex, fieldColors = {} } = options;
  winston.addColors(fieldColors);

  return winston.format.combine(
    winston.format.colorize({ all: true }),
    cleanSecrets({ secrets, regex }),
    winston.format.simple(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((log) => {
      const { timestamp, level, message, context, stack, ...rest } = log;
      const extra = context ? JSON.stringify(context) : '';
      const meta = getMeta(fieldColors, log);

      // If there are extra keys, then an array or an object was logged
      const text = !Object.keys(rest).length ? message : JSON.stringify(rest);

      return [timestamp, meta, `${level}:`, text, stack, extra]
        .filter((v) => v !== null && v !== '')
        .join(' ');
    }),
  );
};
