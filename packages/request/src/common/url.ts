import { RequestInfo } from 'node-fetch';

export const getUrl = (
  baseUrl: RequestInfo | undefined,
  url: RequestInfo,
): RequestInfo => {
  if (typeof url !== 'string') return url;
  if (baseUrl == null) return url;
  if (isAbsoluteUrl(url)) return url;

  return `${baseUrl}${url}`;
};

export const isAbsoluteUrl = (url: RequestInfo): boolean => {
  const regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
  return regexp.test(url.toString());
};
