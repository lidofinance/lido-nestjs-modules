/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { createInterface } from '@lido-nestjs/di';

export const IpfsModuleOptions =
  createInterface<IpfsModuleOptions>('IpfsModuleOptions');

export interface IpfsModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  url: string;
  username?: string;
  password?: string;
}

export interface IpfsModuleOptionsAsync
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<IpfsModuleOptions> | IpfsModuleOptions;
  inject: any[];
}
