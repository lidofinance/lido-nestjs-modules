import * as winston from 'winston';
import { cleanSecrets } from './secrets.format';

const colorizer = winston.format.colorize();

const getMeta = (
  fields: winston.config.AbstractConfigSetColors,
  log: winston.Logform.TransformableInfo,
): string => {
  const metaString = Object.keys(fields)
    .map((key) => [key, log[key]])
    .filter(([, value]) => value != null)
    .map(([key, value]) => colorizer.colorize(key, value))
    .join(' ');

  return metaString ? ` [${metaString}] ` : '';
};

export const simple = (
  secrets?: string[],
  fields: winston.config.AbstractConfigSetColors = {},
): winston.Logform.Format => {
  winston.addColors(fields);

  return winston.format.combine(
    cleanSecrets({ secrets }),
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.simple(),
    winston.format.printf((log) => {
      const { timestamp, level, message, context } = log;
      const extra = context ? JSON.stringify(context) : '';
      const meta = getMeta(fields, log);

      return `${timestamp}${meta}${level}: ${message} ${extra}`;
    }),
  );
};
