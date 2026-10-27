import * as winston from 'winston';

export interface LoggerJSONFormatOptions {
  secrets?: string[];
  regex?: RegExp[];
  includeErrorField?: boolean;
}

export interface LoggerSimpleFormatOptions {
  secrets?: string[];
  regex?: RegExp[];
  fieldColors?: winston.config.AbstractConfigSetColors;
  includeErrorField?: boolean;
}

export interface LoggerCleanSecretsOptions {
  secrets?: string[];
  regex?: RegExp[];
}
