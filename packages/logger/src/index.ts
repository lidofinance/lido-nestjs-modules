export * from './format';
export * from './logger.module';
export * from './transports';
export * from './interfaces';
export * from './mock-logger.module';

export { WINSTON_MODULE_NEST_PROVIDER as LOGGER_PROVIDER } from 'nest-winston';
export { WINSTON_MODULE_OPTIONS as LOGGER_OPTIONS } from 'nest-winston';

export { LoggerService } from '@nestjs/common';
export { LoggerOptions } from 'winston';
