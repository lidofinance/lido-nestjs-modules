import { Middleware } from '../interfaces';
import { Response } from 'node-fetch';
import { isNotServerError } from '../common';

export const retry =
  (maxTries = 3, retryConfig: { ignoreAbort: boolean }): Middleware =>
  async (config, next) => {
    let response!: Response;
    while (maxTries > config.attempt) {
      config.attempt++;
      try {
        response = await next(config);
      } catch (error) {
        // ts I love you!
        if (!(error instanceof Error)) throw error;
        if (error.name === 'AbortError' && !retryConfig.ignoreAbort)
          throw error;
        if (isNotServerError(error)) throw error;
        if (maxTries <= config.attempt) throw error;
        // TODO: delay from Kirill method
        response = await next(config);
      }
    }
    return response;
  };
