import { Inject, Injectable } from '@nestjs/common';
import { CallOverrides } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import {
  Lido,
  Registry,
  LIDO_CONTRACT_TOKEN,
  REGISTRY_CONTRACT_TOKEN,
  TypedEvent,
} from '@lido-nestjs/contracts';

@Injectable()
export class RegistryMetaFetchService {
  constructor(
    @Inject(REGISTRY_CONTRACT_TOKEN)
    private registryContract: Registry,

    @Inject(LIDO_CONTRACT_TOKEN)
    private lidoContract: Lido,
  ) {}

  /** fetches keys operation index */
  public async fetchKeysOpIndex(
    overrides: CallOverrides = {},
  ): Promise<number> {
    const bigNumber = await this.registryContract.getKeysOpIndex(overrides);
    return bigNumber.toNumber();
  }

  /** fetches last unbuffered event */
  public async fetchUnbufferedLogs(
    fromBlock: number,
    toBlock: number,
  ): Promise<TypedEvent<[BigNumber], { amount: BigNumber }>[]> {
    const filter = this.lidoContract.filters.Unbuffered();
    return await this.lidoContract.queryFilter(filter, fromBlock, toBlock);
  }
}
