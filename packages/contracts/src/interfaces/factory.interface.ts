/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer, Provider } from 'ethers';

export interface ContractFactory {
  connect(address: string, signerOrProvider: Signer | Provider): any;
}
