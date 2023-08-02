# Key-validation

NestJS key validation for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/key-validation
```

## Usage

### Basic key validation

```ts
import { Module } from '@nestjs/common';
import {
  KeyValidatorModule,
  Key,
  KeyValidatorInterface,
  GENESIS_FORK_VERSION,
} from '@lido-nestjs/key-validation';
import { CHAINS } from '@lido-nestjs/constants';

@Module({
  imports: [KeyValidatorModule.forFeature({ multithreaded: true })], //
  providers: [Example],
  exports: [Example],
})
export class ExampleModule {}

export class Example {
  public constructor(
    // note that `KeyValidatorInterface` is a Symbol-like interface tag
    // which point to specific implementation
    private readonly keyValidator: KeyValidatorInterface,
  ) {}

  public async basicValidation() {
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
}
```

### Lido key validation

```ts
import { Module } from '@nestjs/common';
import {
  Key,
  LidoKey,
  LidoKeyValidatorInterface,
  LidoKeyValidatorModule,
} from '@lido-nestjs/key-validation';
import { LidoContractModule } from '@lido-nestjs/contracts';
import {
  SimpleFallbackJsonRpcBatchProvider,
  FallbackProviderModule,
} from '@lido-nestjs/execution';

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
    FallbackProviderModule.forRoot({
      urls: ['http://localhost:8545'],
      network: 1,
    }),
    LidoContractModule.forRootAsync({
      // needed for getting WithdrawalCredentials and Network chain id
      async useFactory(provider: SimpleFallbackJsonRpcBatchProvider) {
        return { provider: provider };
      },
      inject: [SimpleFallbackJsonRpcBatchProvider],
    }),
    LidoKeyValidatorModule.forFeature({ multithreaded: true }), // can be multithreaded or single-threaded
  ],
  providers: [Example],
  exports: [Example],
})
export class ExampleModule {}
```

See more examples in the `./examples/` folder.
