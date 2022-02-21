export class FetchError extends Error {
  public name = 'FetchError';
  public message: string;
  public code = 0;
  public data: unknown;

  public constructor(message: string) {
    super('');
    this.message = message;
  }
}
