import { Response } from 'node-fetch';
import { LoggerService } from '@nestjs/common';
import { Middleware } from '../interfaces';

export const logger =
  (logger: LoggerService): Middleware =>
  async (config, next) => {
    let response!: Response;
    logger.log('Start request', config);
    // eslint-disable-next-line prefer-const
    response = await next(config);
    logger.log('End request', config);
    return response;
  };
