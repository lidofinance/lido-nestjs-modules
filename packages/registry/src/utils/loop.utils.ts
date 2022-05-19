export const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class LoopError extends Error {}

export const loop = <T extends () => void>(
  iterval: number,
  cb: T,
  onError?: (error: Error) => void,
  errorTimeout = 30 * 60000,
) => {
  let blocked = false;
  let timer: NodeJS.Timeout;
  const intervalLink = setInterval(async () => {
    if (blocked) return;
    try {
      blocked = true;
      await Promise.race([
        cb(),
        new Promise((_r, rej) => {
          timer = setTimeout(
            rej,
            errorTimeout,
            new LoopError('timeout loop error'),
          );
        }),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      onError && onError(error);
    } finally {
      clearTimeout(timer);
      blocked = false;
    }
  }, iterval);

  return () => clearInterval(intervalLink);
};
