/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';

export interface ContractFactory {
  connect(address: string, signerOrProvider: Signer | Provider): any;
}
