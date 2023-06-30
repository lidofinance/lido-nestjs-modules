/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer as SignerType, Provider as ProviderType } from 'ethers';

export interface ContractFactory {
  connect(address: string, signerOrProvider: SignerType | ProviderType): any;
}
