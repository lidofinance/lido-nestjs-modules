/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import { Lido, LIDO_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { Registry, REGISTRY_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { CallOverrides } from './interfaces/overrides.interface';
import { UnbufferedEvent } from './interfaces/meta.interface';

@Injectable()
export class RegistryMetaFetchService {
  constructor(
    @Inject(REGISTRY_CONTRACT_TOKEN) private registryContract: Registry,
    @Inject(LIDO_CONTRACT_TOKEN) private lidoContract: Lido,
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
  public async fetchLastUnbufferedLog(block: {
    hash: string;
    number: number;
  }): Promise<UnbufferedEvent> {
    const result = await Promise.all([
      await this.fetchUnbufferedLogsInBlock(block.hash),
      await this.fetchUnbufferedLogsInHistory(block.number),
    ]);

    const logs = result
      .flat()
      .filter((v) => !!v)
      .sort((a, b) => b.blockNumber - a.blockNumber);

    const lastLog = logs[0];

    if (!lastLog) {
      throw new Error('No unbuffered events found');
    }

    return lastLog;
  }

  /** fetches last unbuffered logs in history */
  public async fetchUnbufferedLogsInHistory(
    blockNumber: number,
    step = 10000,
  ): Promise<UnbufferedEvent[]> {
    const fromBlock = Math.max(blockNumber - step + 1, 0);
    const toBlock = Math.max(blockNumber, 0);

    if (fromBlock === 0 && toBlock === 0) {
      throw new Error('No unbuffered events found');
    }

    if (step <= 0) {
      throw new Error('Step must be greater than 0');
    }

    const logs = await this.fetchUnbufferedLogsInRange(fromBlock, toBlock);
    if (logs.length) return logs;

    return await this.fetchUnbufferedLogsInHistory(toBlock - step, step);
  }

  /** fetches unbuffered logs in a block range */
  public async fetchUnbufferedLogsInRange(
    fromBlock: number,
    toBlock: number,
  ): Promise<UnbufferedEvent[]> {
    const filter = this.lidoContract.filters.Unbuffered();
    return await this.lidoContract.queryFilter(filter, fromBlock, toBlock);
  }

  /** fetches unbuffered logs in a block */
  public async fetchUnbufferedLogsInBlock(
    blockHash: string,
  ): Promise<UnbufferedEvent[]> {
    const filter = this.lidoContract.filters.Unbuffered();
    return await this.lidoContract.queryFilter(filter, blockHash);
  }
}
