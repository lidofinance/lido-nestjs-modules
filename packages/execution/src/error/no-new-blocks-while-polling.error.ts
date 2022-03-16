export class NoNewBlocksWhilePollingError extends Error {
  public name = 'NoNewBlocksWhilePollingError';
  public message: string;
  public latestObservedBlockNumber: number;

  public constructor(message: string, latestObservedBlockNumber: number) {
    super('');
    this.message = message;
    this.latestObservedBlockNumber = latestObservedBlockNumber;
  }
}
