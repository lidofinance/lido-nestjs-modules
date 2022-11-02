import { Injectable } from '@nestjs/common';
import { IpfsGeneralService } from '@lido-nestjs/ipfs-http-client';
import { NopKeysResult, isKeySignPairArray, KeySignPair } from './interfaces';

@Injectable()
export class IpfsNopKeysService {
  constructor(protected readonly ipfsClient: IpfsGeneralService) {}

  async addKeySign(values: KeySignPair[]): Promise<NopKeysResult> {
    if (!isKeySignPairArray(values)) {
      throw new Error('Incorrect parameter, values should be KeySignPair[]');
    }

    const data = JSON.stringify(values);

    const result = await this.ipfsClient.add(data);

    return { cid: result.cid, data: values };
  }

  async getKeySign(cid: string): Promise<NopKeysResult> {
    const result = await this.ipfsClient.get(cid);

    const json = JSON.parse(result.data);

    if (!isKeySignPairArray(json)) {
      throw Error('Incorrect parameter, values should be KeySignPair[]');
    }

    return { cid: result.cid, data: json };
  }
}
