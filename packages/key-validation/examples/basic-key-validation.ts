/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module } from '@nestjs/common';
import {
  KeyValidatorModule,
  Key,
  KeyValidatorInterface,
  GENESIS_FORK_VERSION,
} from '@lido-nestjs/key-validation';
import { CHAINS } from '@lido-nestjs/constants';
import { DOMAIN_DEPOSIT } from '../src';

export class Example {
  public constructor(
    // note that `KeyValidatorInterface` is a Symbol-like interface tag
    // which point to specific implementation
    private readonly keyValidator: KeyValidatorInterface,
  ) {}

  public async basic() {
    const key: Key = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      withdrawalCredentials: Buffer.alloc(32),
      genesisForkVersion:
        GENESIS_FORK_VERSION[CHAINS.Mainnet] ?? Buffer.alloc(32),
    };

    const resultSingleKey: boolean = await this.keyValidator.validateKey(key);

    const resultMultipleKeys: [Key, boolean][] =
      await this.keyValidator.validateKeys([key]);
  }

  public async validationWithMoreProperties() {
    const key: Key = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      withdrawalCredentials: Buffer.alloc(32),
      genesisForkVersion:
        GENESIS_FORK_VERSION[CHAINS.Mainnet] ?? Buffer.alloc(32),
      amount: 2 * 10 ** 9, // in case user wants to override the amount of deposit
      domainDeposit: DOMAIN_DEPOSIT,
    };

    const resultSingleKey: boolean = await this.keyValidator.validateKey(key);

    const resultMultipleKeys: [Key, boolean][] =
      await this.keyValidator.validateKeys([key]);
  }

  public async validationWithCustomProperties() {
    type CustomKey = Key & { customProperty: string };

    const key: CustomKey = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      withdrawalCredentials: Buffer.alloc(32),
      genesisForkVersion:
        GENESIS_FORK_VERSION[CHAINS.Mainnet] ?? Buffer.alloc(32),
      amount: 2 * 10 ** 9, // in case user wants to override the amount of deposit
      domainDeposit: DOMAIN_DEPOSIT,

      // custom property can be passed with a key
      customProperty: 'have a nice day',
    };

    const resultSingleKey: boolean = await this.keyValidator.validateKey(key);

    const resultMultipleKeys: [Key & { customProperty: string }, boolean][] =
      await this.keyValidator.validateKeys([key]);
  }
}

@Module({
  imports: [KeyValidatorModule.forFeature({ multithreaded: true })], //
  providers: [Example],
  exports: [Example],
})
export class ExampleModule {}
