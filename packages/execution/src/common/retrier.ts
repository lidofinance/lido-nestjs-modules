import { LoggerService } from '@nestjs/common/services/logger.service';
import { sleep } from './sleep';

export const retrier = (
  logger?: LoggerService | null,
  defaultMaxRetryCount = 3,
  defaultMinBackoffMs = 1000,
  defaultMaxBackoffMs = 60000,
  defaultLogWarning = false,
) => {
  return async <T extends unknown>(
    callback: () => Promise<T> | T,
    maxRetryCount?: number,
    minBackoffMs?: number,
    maxBackoffMs?: number,
    logWarning?: boolean,
  ): Promise<T> => {
    maxRetryCount = maxRetryCount ?? defaultMaxRetryCount;
    minBackoffMs = minBackoffMs ?? defaultMinBackoffMs;
    maxBackoffMs = maxBackoffMs ?? defaultMaxBackoffMs;
    logWarning = logWarning ?? defaultLogWarning;
    try {
      return await callback();
    } catch (err) {
      if (logger && logWarning) {
        logger.warn(
          err,
          'Retrying after (%dms). Remaining retries [%d]',
          minBackoffMs,
          maxRetryCount,
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
      );
    }
  };
};
