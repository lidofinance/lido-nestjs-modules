export class AllProvidersFailedError extends Error {
  public name = 'AllProvidersFailedError';
  public message: string;
  public code = 0;
  public originalError: Error | unknown;

  public constructor(message: string) {
    super('');
    this.message = message;
  }
}
