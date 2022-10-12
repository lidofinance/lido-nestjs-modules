import { CustomMiddleware } from '..';

export const timeout =
  (ms: number): CustomMiddleware =>
  async (next, payload) => {
    if (!payload?.abortController) return next();
    const timer = setTimeout(() => {
      payload.abortController?.abort();
    }, ms);
    const res = await next();
    timer.unref();
    return res;
  };
