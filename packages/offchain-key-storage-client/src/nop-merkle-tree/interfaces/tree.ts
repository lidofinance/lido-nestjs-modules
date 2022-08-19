import { KeySignBuffer } from './key-sign-buffer';

export type Tree = {
  hashes: string[];
  root: string;
  leafAmount: number;
  data: KeySignBuffer[];
};
