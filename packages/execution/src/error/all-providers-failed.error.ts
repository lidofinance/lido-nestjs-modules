export class AllProvidersFailedError extends Error {
  public name = 'AllProvidersFailedError';
  public code = 0;
  public cause: Error | unknown;

  // for backward-compatibility
  public get originalError(): Error | unknown {
    return this.cause;
  }

  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
