import * as winston from 'winston';

export interface LoggerJSONFormatOptions {
  secrets?: string[];
}

export interface LoggerSimpleFormatOptions {
  secrets?: string[];
  fieldColors?: winston.config.AbstractConfigSetColors;
}

export interface LoggerCleanSecretsOptions {
  secrets?: string[];
}
