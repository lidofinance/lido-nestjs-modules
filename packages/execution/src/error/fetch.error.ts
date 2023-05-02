export class FetchError extends Error {
  public name = 'FetchError';
  public code: string | number = 0;
  public data: unknown;

  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
