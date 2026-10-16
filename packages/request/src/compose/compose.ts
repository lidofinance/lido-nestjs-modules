import { InternalConfig, Middleware, RequestConfig } from '../interfaces';
import fetch, { Response } from 'node-fetch';
import { deepClone, getUrl } from '../common';

const fetchCall = ({ url, baseUrl, ...rest }: RequestConfig) =>
  fetch(getUrl(baseUrl, url), rest);

export function compose(middleware: Middleware[]) {
  return (requestConfig: RequestConfig) => {
    // copy object bcs we can mutate it
    const internalConfig = deepClone(requestConfig) as InternalConfig;
    internalConfig.attempt = 0;

    async function chain(
      config: InternalConfig,
      middleware: Middleware[],
    ): Promise<Response> {
      if (middleware.length === 0) return fetchCall(config);
      return middleware[0](config, (config) =>
        chain(config, middleware.slice(1)),
      );
    }

    return chain(internalConfig, middleware);
  };
}
