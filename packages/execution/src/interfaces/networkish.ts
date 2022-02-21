export type ChainId = number;

export type NetworkInfo = {
  name: string;
  chainId: ChainId;
  ensAddress?: string;
};

export type Networkish = NetworkInfo | ChainId;
