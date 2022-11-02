import { FetchService } from '@lido-nestjs/fetch';
import { Injectable } from '@nestjs/common';
import { Result, IpfsFileData, isIpfsFileData } from './interfaces';

@Injectable()
export class IpfsGeneralService {
  private _url;
  private _password;
  private _username;

  constructor(
    protected httpService: FetchService,
    url: string,
    username: string,
    password: string,
  ) {
    this._url = url;
    this._password = password;
    this._username = username;
  }

  async add(value: string): Promise<Result> {
    const urlFinal = this.prepareUrl(this._url);
    const boundary = 'ipfs-lib';
    const payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${value}\r\n--${boundary}--`;

    const headers: HeadersInit = {
      accept: 'application/json',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    if (this._username && this._password) {
      const auth = Buffer.from(
        `${this._username}:${this._password}`,
        'binary',
      ).toString('base64');

      headers['Authorization'] = `Basic ${auth}`;
    }

    const res = await this.httpService.fetchJson<IpfsFileData>(
      `${urlFinal}/add?pin=true`,
      {
        method: 'POST',
        headers,
        body: payload,
      },
    );

    if (!isIpfsFileData(res)) {
      throw new Error(`Unexpected result: ${JSON.stringify(res)}`);
    }

    return { cid: res.Hash, data: value };
  }

  async get(cid: string): Promise<Result> {
    const urlFinal = this.prepareUrl(this._url);
    const queryString = new URLSearchParams({
      arg: cid,
    });

    const headers: HeadersInit = {};

    if (this._username && this._password) {
      const auth = Buffer.from(
        `${this._username}:${this._password}`,
        'binary',
      ).toString('base64');

      headers['Authorization'] = `Basic ${auth}`;
    }

    const data = await this.httpService.fetchText(
      `${urlFinal}/cat?${queryString}`,
      {
        method: 'POST',
        headers,
      },
    );

    return { cid, data };
  }

  private prepareUrl(url: string) {
    return url.replace(/\/$/, '');
  }
}
