import snakeCase from 'lodash.snakecase';
import { RequestInit } from 'node-fetch-cjs';
import { AbortController } from 'node-abort-controller';
import { FetchService } from '@lido-nestjs/fetch';
import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  CONSENSUS_OPTIONS_TOKEN,
  CONSENSUS_DEFAULT_POOL_INTERVAL,
  CONSENSUS_DEFAULT_SLOT_NUMBER,
} from '../consensus.constants';
import { ConsensusMethodArgs } from '../interfaces/consensus.interface';
import { ConsensusModuleOptions } from '../interfaces/module.interface';
import { ConsensusSubscribeCallback } from '../interfaces/subscribe.interface';
import { ConsensusService } from '../service/consensus.service';

@Injectable()
export class ConsensusBaseService {
  constructor(
    @Optional()
    @Inject(CONSENSUS_OPTIONS_TOKEN)
    public options: ConsensusModuleOptions | null,

    protected fetchService: FetchService,
  ) {}

  private _slotNumber: number | undefined;

  public async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    return await this.fetchService.fetchJson(path, init);
  }

  public getSearchString(
    queryObject: Record<string, string[] | string | number | undefined>,
  ): string {
    const searchParams = new URLSearchParams();
    Object.entries(queryObject).forEach(([key, value]) => {
      if (value == null) return;
      searchParams.append(snakeCase(key), String(value));
    });
    const searchString = searchParams.toString();
    return searchString ? `?${searchString}` : '';
  }

  /**
   * Pool interval
   */
  public get pollingInterval() {
    return this.options?.pollingInterval ?? CONSENSUS_DEFAULT_POOL_INTERVAL;
  }

  /*
   * Polling slot number
   */

  public get slotNumber() {
    return this._slotNumber ?? CONSENSUS_DEFAULT_SLOT_NUMBER;
  }

  public set slotNumber(value: number) {
    if (!Number.isFinite(value)) {
      throw new Error(`New slot (${value}) is not a number`);
    }

    if (value < this.slotNumber) {
      throw new Error(
        `New slot (${value}) is smaller than the previous one (${this.slotNumber})`,
      );
    }

    this._slotNumber = value;
  }

  /**
   * Subscribes to blocks
   * @param callback - calls for a new block
   */
  public subscribe(
    this: ConsensusService,
    callback: ConsensusSubscribeCallback,
    args?: ConsensusMethodArgs<'getBlock'>,
  ): () => void {
    let timer: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;

    const stopPreviousTick = () => {
      controller?.abort();
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, this.pollingInterval);
    };

    const tick = async () => {
      stopPreviousTick();

      try {
        controller = new AbortController();
        const { signal } = controller;

        const { data } = await this.getBlock({
          blockId: 'head',
          ...args,
          options: { ...args?.options, signal },
        });

        const fetchedSlot = Number(data?.message?.slot);
        const savedSlot = this.slotNumber;

        if (fetchedSlot === savedSlot) return;

        this.slotNumber = fetchedSlot;
        callback(null, data);
      } catch (error) {
        callback(error, null);
      }
    };

    tick();

    const unsubscribe = () => {
      if (timer != null) clearTimeout(timer);
      if (controller != null) controller.abort();
    };

    return unsubscribe;
  }
}
