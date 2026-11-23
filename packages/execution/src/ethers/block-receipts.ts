import { TransactionReceipt } from '@ethersproject/providers';
import { isHexString } from '@ethersproject/bytes';
import { ExtendedJsonRpcBatchProvider } from '../provider/extended-json-rpc-batch-provider';
import { SimpleFallbackJsonRpcBatchProvider } from '../provider/simple-fallback-json-rpc-batch-provider';

// `confirmations` is not part of the JSON-RPC receipt: ethers computes it
// with an extra block number request, which is not done here
export type BlockReceipt = Omit<TransactionReceipt, 'confirmations'>;

export async function getBlockReceipts(
  this: ExtendedJsonRpcBatchProvider | SimpleFallbackJsonRpcBatchProvider,
  blockHashOrBlockTag: string | number,
): Promise<BlockReceipt[] | null> {
  await this.getNetwork();

  // a block hash goes as is: formatting it as a quantity would strip leading zeros
  const blockTag = isHexString(blockHashOrBlockTag, 32)
    ? blockHashOrBlockTag
    : this.formatter.blockTag(blockHashOrBlockTag);

  const result = (await this.perform('getBlockReceipts', { blockTag })) as
    | unknown[]
    | null;

  if (result == null) {
    return null;
  }

  return result.map((receipt) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmations, ...blockReceipt } = this.formatter.receipt(receipt);
    return blockReceipt;
  });
}
