/**
 * No execution payload applied to the beacon state was found within the lookback window.
 *
 * Since Gloas (EIP-7732) a block does not carry its execution payload. It only commits to a bid, and the payload the
 * state already has belongs to one of the ancestors. Finding it means walking back over the ancestors, and the walk
 * gives up after `payloadLookbackDepth` blocks.
 *
 * Raising the depth in the module options helps when the chain really did skip that many payloads in a row. Otherwise
 * this error points at a node that answers from a different branch of the chain.
 */
export class ExecutionPayloadNotFoundError extends Error {
  public constructor(
    message: string,
    public readonly blockHash?: string,
    public readonly lookbackDepth?: number,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
