import * as winston from 'winston';
import { satanizer } from '@lidofinance/satanizer';
import { LoggerCleanSecretsOptions } from '../interfaces';
import { secretPatterns } from './secret-patterns';

// winston keeps the level, the extra arguments and the final message under symbol keys,
// and the masking walk copies string keys only
const LEVEL = Symbol.for('level');

type SymbolKeyed = Record<symbol, unknown>;

/**
 * The mask `cleanSecrets` applies, for values that leave the app past the logger, such as Sentry
 * events.
 */
export const secretsMask = ({
  secrets = [],
  regex = [],
}: LoggerCleanSecretsOptions = {}): (<T>(input: T) => T) =>
  // An empty secret matches at every position of every string and masks nothing
  satanizer([...secrets.filter(Boolean).flatMap(secretPatterns), ...regex]);

export const cleanSecrets = (
  options: LoggerCleanSecretsOptions = {},
): winston.Logform.Format => {
  const mask = secretsMask(options);

  return winston.format((info) => {
    // One mask call masks a limited number of values, and a large payload would use them up before
    // the level and the message. The level is a plain name and is kept, like its symbol.
    const { level, message, ...rest } = info;
    const masked = { level, message: mask(message), ...mask(rest) };
    const source = info as unknown as SymbolKeyed;
    const target = masked as unknown as SymbolKeyed;

    for (const key of Object.getOwnPropertySymbols(info)) {
      // Transports route by the raw level, a pattern must not rewrite it
      target[key] = key === LEVEL ? source[key] : mask(source[key]);
    }

    return masked;
  })();
};
