import { Injectable } from '@nestjs/common';
import { IpfsGeneralService } from './ipfs.general.service';
import {
  NopKeysResult,
  isKeySignPairArray,
  KeySignPair,
  IpfsConfig,
} from './interfaces';

@Injectable()
export class IpfsNopKeysService extends IpfsGeneralService {
  async addKeySign(
    values: KeySignPair[],
    url: string,
    opts: IpfsConfig,
  ): Promise<NopKeysResult> {
    if (!isKeySignPairArray(values)) {
      return Promise.resolve({
        cid: null,
        data: null,
        error: 'Incorrect parameter, values should be KeySignPair[]',
      });
    }

    const data = JSON.stringify(values);

    const result = await this.add(data, url, opts);

    if (result.error) {
      return { cid: null, error: result.error, data: null };
    }

    return { cid: result.cid, error: null, data: values };
  }

  async getKeySign(
    cid: string,
    url: string,
    opts: IpfsConfig,
  ): Promise<NopKeysResult> {
    const result = await this.get(cid, url, opts);

    if (result.error) {
      return { cid: null, error: result.error, data: null };
    }

    const json = this.parseJson(result.data);

    if (!json || (json && !isKeySignPairArray(json))) {
      return {
        cid: null,
        data: null,
        error: `Unexpected result: ${result.data}`,
      };
    }

    return { cid: result.cid, error: null, data: json };
  }

  parseJson(data: string | null) {
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
