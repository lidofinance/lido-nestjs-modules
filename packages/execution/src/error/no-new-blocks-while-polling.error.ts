export class NoNewBlocksWhilePollingError extends Error {
  public name = 'NoNewBlocksWhilePollingError';
  public latestObservedBlockNumber: number;

  public constructor(message: string, latestObservedBlockNumber: number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.latestObservedBlockNumber = latestObservedBlockNumber;
  }
}
