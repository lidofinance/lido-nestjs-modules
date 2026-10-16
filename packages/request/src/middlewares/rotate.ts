import { Middleware } from '../interfaces';
import { RequestInfo } from 'node-fetch';

const pickUrl = (baseUrls: [RequestInfo], attempt: number) =>
  baseUrls[attempt % baseUrls.length];

export const rotate =
  (baseUrls: [RequestInfo]): Middleware =>
  async (config, next) => {
    if (!config.baseUrl && baseUrls.length)
      config.baseUrl = pickUrl(baseUrls, config.attempt);
    const response = await next(config);
    if (!baseUrls.length) return response;
    if (isNaN(config.attempt) || config.attempt <= 0) return response;
    config.baseUrl = pickUrl(baseUrls, config.attempt);
    return response;
  };
