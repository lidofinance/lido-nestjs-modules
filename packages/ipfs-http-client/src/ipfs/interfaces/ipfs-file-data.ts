import { hasAttributes } from './utils';

export type IpfsFileData = {
  Hash: string;
};

export const isIpfsFileData = (value: unknown): value is IpfsFileData => {
  return hasAttributes(value, ['Hash']) && typeof value.Hash === 'string';
};
