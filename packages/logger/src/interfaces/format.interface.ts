import * as winston from 'winston';

export interface LoggerJSONFormatOptions {
  secrets?: string[];
  regex?: RegExp[];
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
