/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';

export interface ValidatorsRegistryModuleOptions {
  /**
   * How many blocks back to walk when looking for the execution payload that the beacon state already has.
   *
   * Only used since Gloas (EIP-7732), where the payload of a block is revealed apart from it and may be skipped.
   * The walk follows `parent_root`, so it counts proposed blocks and not slots.
   *
   * A positive integer. Anything else makes the module throw while it is being created, so that the application
   * does not start with a depth it cannot work with.
   *
   * Defaults to `VALIDATORS_REGISTRY_DEFAULT_PAYLOAD_LOOKBACK_DEPTH`.
   */
  payloadLookbackDepth?: number;
}

export interface ValidatorsRegistryModuleSyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    ValidatorsRegistryModuleOptions {}

export interface ValidatorsRegistryModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ValidatorsRegistryModuleOptions>;
  inject?: any[];
}
