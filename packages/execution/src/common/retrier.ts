import { LoggerService } from '@nestjs/common/services/logger.service';
import { sleep } from './sleep';

export const retrier = (
  logger?: LoggerService | null,
  defaultMaxRetryCount = 3,
  defaultMinBackoffMs = 1000,
  defaultMaxBackoffMs = 60000,
  defaultLogWarning = false,
  defaultErrorFilter?: (error: Error | unknown) => boolean,
) => {
  return async <T extends unknown>(
    callback: () => Promise<T> | T,
    maxRetryCount?: number,
    minBackoffMs?: number,
    maxBackoffMs?: number,
    logWarning?: boolean,
    errorFilter?: (error: Error | unknown) => boolean,
  ): Promise<T> => {
    maxRetryCount = maxRetryCount ?? defaultMaxRetryCount;
    minBackoffMs = minBackoffMs ?? defaultMinBackoffMs;
    maxBackoffMs = maxBackoffMs ?? defaultMaxBackoffMs;
    logWarning = logWarning ?? defaultLogWarning;
    errorFilter = errorFilter ?? defaultErrorFilter;
    try {
      return await callback();
    } catch (err) {
      if (typeof errorFilter === 'function' && errorFilter(err)) {
        throw err;
      }

      if (logger && logWarning) {
        logger.warn(
          err,
          `Retrying after (${minBackoffMs}ms). Remaining retries [${maxRetryCount}]`,
        );
      }
      if (maxRetryCount <= 1 || minBackoffMs >= maxBackoffMs) {
        throw err;
      }
      await sleep(minBackoffMs);
      return await retrier(logger)(
        callback,
        maxRetryCount - 1,
        minBackoffMs * 2,
        maxBackoffMs,
        logWarning,
        errorFilter,
      );
    }
  };
};
