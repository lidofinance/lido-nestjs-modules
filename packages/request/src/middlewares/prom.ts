import { Response } from 'node-fetch';
import { InternalConfig, Middleware } from '../interfaces';
import { Histogram } from 'prom-client';
import { getUrl } from '../common';
import { HttpException } from '@nestjs/common';

type PromReturnTypeSerializer =
  | Partial<Record<string, string | number>>
  | undefined;

const defaultSerializer = (
  config: InternalConfig,
  response: Response,
  error?: Error,
): PromReturnTypeSerializer => {
  const url = getUrl(config.baseUrl, config.url);
  const status = error instanceof HttpException ? error.getStatus() : 'unknown';
  return {
    result: error ? 'error' : 'result',
    status: error ? status : response.status,
    url: url.toString(),
  };
};

/**
 * Simple middleware for prom-client
 *
 * ```ts
 * const h = new Histogram({
 *   name: 'name',
 *   help: 'help',
 *   buckets: [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 20],
 *   labelNames: ['result', 'status'],
 * });
 * // With default serializer
 * prom(h)
 * // With custom serializer
 * prom(h, (config, res, error) => ({
 *  result: error ? 'error' : 'result',
 *  status: 200,
 *  url: config.url.toString(),
 * }));
 * ```
 * @param prom Histogram instance
 * @param serialize callback fn for pick values from iteration
 * @returns Response
 */
export const prom =
  (
    prom: Histogram,
    serialize: (
      conf: InternalConfig,
      response: Response,
      error?: Error,
    ) => PromReturnTypeSerializer = defaultSerializer,
  ): Middleware =>
  async (config, next) => {
    let response!: Response;
    const timer = prom.startTimer();
    try {
      response = await next(config);
      timer(serialize(config, response));
    } catch (error) {
      if (!(error instanceof Error)) {
        timer(serialize(config, response));
        throw error;
      }
      timer(serialize(config, response, error));
      throw error;
    }
    return response;
  };
