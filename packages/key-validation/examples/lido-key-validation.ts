/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module } from '@nestjs/common';
import {
  Key,
  LidoKey,
  LidoKeyValidatorInterface,
  LidoKeyValidatorModule,
} from '@lido-nestjs/key-validation';
import { LidoContractModule } from '@lido-nestjs/contracts';

export class Example {
  public constructor(
    // note that `LidoKeyValidatorInterface` is a Symbol-like interface tag
    // which point to specific implementation
    private readonly lidoKeyValidator: LidoKeyValidatorInterface,
  ) {}

  public async someMethod() {
    const key1: LidoKey = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      used: true,
    };

    const key2: LidoKey = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      used: true,
    };

    // single key
    const resultSingleKey: [Key & LidoKey, boolean] =
      await this.lidoKeyValidator.validateKey(key1);

    // multiple keys
    const resultMultupleKeys: [Key & LidoKey, boolean][] =
      await this.lidoKeyValidator.validateKeys([key1, key2]);
  }
}

@Module({
  imports: [
    LidoContractModule.forRoot(), // needed for getting WithdrawalCredentials and Network chain id
    LidoKeyValidatorModule.forFeature({ multithreaded: true }), // can be multithreaded or single-threaded
  ],
  providers: [Example],
  exports: [Example],
})
export class ExampleModule {}
