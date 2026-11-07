import * as winston from 'winston';
import { satanizer } from '@lidofinance/satanizer';
import { LoggerCleanSecretsOptions } from '../interfaces';
import { secretPatterns } from './secret-patterns';

// winston keeps the level, the extra arguments and the final message under symbol keys,
// and the masking walk copies string keys only
const LEVEL = Symbol.for('level');

type SymbolKeyed = Record<symbol, unknown>;

export const cleanSecrets = (
  options: LoggerCleanSecretsOptions = {},
): winston.Logform.Format => {
  const { secrets = [], regex = [] } = options;
  // An empty secret matches at every position of every string and masks nothing
  const strings = secrets.filter(Boolean);
  const mask = satanizer([...strings.flatMap(secretPatterns), ...regex]);

  return winston.format((info) => {
    const masked = mask(info);
    const source = info as unknown as SymbolKeyed;
    const target = masked as unknown as SymbolKeyed;

    for (const key of Object.getOwnPropertySymbols(info)) {
      // Transports route by the raw level, a pattern must not rewrite it
      target[key] = key === LEVEL ? source[key] : mask(source[key]);
    }

    return masked;
  })();
};
