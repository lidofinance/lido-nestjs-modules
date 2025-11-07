export class RequestTimeoutError extends Error {
  public name = 'RequestTimeoutError';
  public timeoutMs: number;

  public constructor(message: string, timeoutMs: number) {
    super(message);
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
