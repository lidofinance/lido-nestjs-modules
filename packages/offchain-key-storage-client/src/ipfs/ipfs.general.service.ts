import { FetchService } from '@lido-nestjs/fetch';
import { Injectable } from '@nestjs/common';
import { Result, IpfsFileData, isIpfsFileData, IpfsConfig } from './interfaces';

@Injectable()
export class IpfsGeneralService {
  constructor(protected httpService: FetchService) {}

  private DEFAULT_URL = 'http://127.0.0.1:5001/api/v0';

  async add(value: string, url?: string, opts?: IpfsConfig): Promise<Result> {
    const urlFinal = this.prepareUrl(url);
    const boundary = 'ipfs-lib';
    const payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${value}\r\n--${boundary}--`;

    const headers: HeadersInit = {
      accept: 'application/json',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    if (opts && opts.username && opts.password) {
      const auth = Buffer.from(
        `${opts.username}:${opts.password}`,
        'binary',
      ).toString('base64');

      headers['Authorization'] = `Basic ${auth}`;
    }

    let res;
    try {
      res = await this.httpService.fetchJson<IpfsFileData>(
        `${urlFinal}/add?pin=true`,
        {
          method: 'POST',
          headers,
          body: payload,
        },
      );
    } catch (error) {
      return {
        cid: null,
        data: null,
        error: `Error during fetch, error: ${(error as Error).message}`,
      };
    }

    if (!isIpfsFileData(res)) {
      return {
        cid: null,
        data: null,
        error: `Unexpected result: ${JSON.stringify(res)}`,
      };
    }

    return { cid: res.Hash, data: value, error: null };
  }

  async get(cid: string, url?: string, opts?: IpfsConfig): Promise<Result> {
    const urlFinal = this.prepareUrl(url);
    const queryString = new URLSearchParams({
      arg: cid,
    });

    const headers: HeadersInit = {};

    if (opts && opts.username && opts.password) {
      const auth = Buffer.from(
        `${opts.username}:${opts.password}`,
        'binary',
      ).toString('base64');

      headers['Authorization'] = `Basic ${auth}`;
    }

    try {
      const data = await this.httpService.fetchText(
        `${urlFinal}/cat?${queryString}`,
        {
          method: 'POST',
          headers,
        },
      );

      return { cid, data, error: null };
    } catch (error) {
      return {
        cid: null,
        data: null,
        error: `Error during fetch, error: ${(error as Error).message}`,
      };
    }
  }

  private prepareUrl(url: string | undefined) {
    return (url || this.DEFAULT_URL).replace(/\/$/, '');
  }
}
