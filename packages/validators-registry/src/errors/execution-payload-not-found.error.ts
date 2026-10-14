/**
 * The execution payload applied to the beacon state could not be read.
 *
 * Since Gloas (EIP-7732) a block does not carry its execution payload. It only commits to a bid, and the payload the
 * state already has belongs to one of the ancestors. Getting it takes two steps, and the error covers both of them:
 *
 * - the block it belongs to is looked for by walking the ancestors back, and the walk gives up after
 *   `payloadLookbackDepth` blocks. `lookbackDepth` is set in this case;
 * - the payload itself is then read from the envelope of that block, and the node may have none to give.
 *
 * Raising the depth in the module options helps when the chain really did skip that many payloads in a row. Otherwise
 * both cases point at the node: it either follows another branch of the chain, or keeps no envelopes that old.
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
