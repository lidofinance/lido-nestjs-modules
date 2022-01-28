export class FetchError extends Error {
  public name = 'FetchError';
  public message: string;
  public code = '';
  public data = '';

  public constructor(message?: string) {
    super('');
    this.message = message || `FetchError`;
  }
}
