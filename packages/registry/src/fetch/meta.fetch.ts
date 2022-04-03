/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import { BigNumber } from '@ethersproject/bignumber';
import {
  Lido,
  Registry,
  LIDO_CONTRACT_TOKEN,
  REGISTRY_CONTRACT_TOKEN,
  TypedEvent,
} from '@lido-nestjs/contracts';
import { CallOverrides } from './interfaces/overrides.interface';

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
    const bigNumber = await this.registryContract.getKeysOpIndex(
      overrides as any,
    );
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

  /** fetches last unbuffered event */
  public async fetchLastUnbufferedLog(
    blockNumber: number,
    step = 1000,
  ): Promise<TypedEvent<[BigNumber], { amount: BigNumber }>> {
    const fromBlock = Math.max(blockNumber - step + 1, 0);
    const toBlock = Math.max(blockNumber, 0);

    if (fromBlock === 0 && toBlock === 0) {
      throw new Error('No events found');
    }

    if (step <= 0) {
      throw new Error('Step must be greater than 0');
    }

    const logs = await this.fetchUnbufferedLogs(fromBlock, toBlock);
    const sorted = logs.sort((a, b) => b.blockNumber - a.blockNumber);
    const filtered = sorted.filter(({ removed }) => removed === false);

    if (filtered.length === 0) {
      return await this.fetchLastUnbufferedLog(toBlock - step, step);
    }

    return filtered[0];
  }
}
