import * as winston from 'winston';

export interface LoggerJSONFormatOptions {
  secrets?: string[];
  regex?: RegExp[];

  /**
   * Toggle timestamp
   * Default: false
   * Default format: 'YYYY-MM-DD HH:mm:ss'
   */
  timestamp?: boolean;
}

export interface LoggerSimpleFormatOptions {
  secrets?: string[];
  regex?: RegExp[];
  fieldColors?: winston.config.AbstractConfigSetColors;
}

export interface LoggerCleanSecretsOptions {
  secrets?: string[];
  regex?: RegExp[];
}
