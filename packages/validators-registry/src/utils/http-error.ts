/**
 * HTTP status of an error, `undefined` when the error carries none.
 *
 * `@lido-nestjs/fetch` throws an `HttpException` of Nest for an answer that is not 2xx. The check is done by the
 * shape of the error and not by `instanceof`, so that it still works when the app ends up with more than one copy of
 * `@nestjs/common`.
 */
export const getHttpErrorStatus = (error: unknown): number | undefined => {
  const status = (error as { getStatus?: () => unknown })?.getStatus?.();

  return typeof status === 'number' ? status : undefined;
};
