# Key-validation

NestJS key validation for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/key-validation
```

## Usage

### Basic usage

#### Single WC

```ts
import { CHAINS } from '@lido-nestjs/constants';
import {
  validateKey,
  GENESIS_FORK_VERSION,
  Key,
  bufferFromHexString,
} from '@lido-nestjs/key-validation';

const key: Key = {
  key: '0xb9cb5f6d464ef72e25fa9b69f87a782eaf60418d0e85344c979b101cf3dcfc5aa68eb85ade0ea99c2af15c39712fc524',
  depositSignature:
    '0xb7b225f21eb951bb3a3265b6574e84815dcceed50df3bd303440e5ea119cab5bd43775bf3b17c173f7f44d207f118ba309357de630c3fa452ef6267ae5bc4e22debece861cdb5b5756250c6c2c65071cf42fba2e52bc0227e02e439f842489ae',
};

const currentWithdrawalCredentials =
  '0x010000000000000000000000b9d7934878b5fb9610b3fe8a5e441e8fad7e293f';
const withdrawalCredentialsBuffer = bufferFromHexString(currentWC);

const isValid = validateKey(
  key,
  withdrawalCredentials,
  GENESIS_FORK_VERSION[CHAINS.Mainnet],
);
```

#### Usage with multiple possible WC

```ts
import { CHAINS } from '@lido-nestjs/constants';
import {
  validateLidoKeyForPossibleWC,
  PossibleWC,
  bufferFromHexString,
} from '@lido-nestjs/key-validation';
import { LidoKey } from './common';

const currentWithdrawalCredentials =
  '0x010000000000000000000000b9d7934878b5fb9610b3fe8a5e441e8fad7e293f';
const possibleWC: PossibleWC = {
  currentWC: [currentWC, bufferFromHexString(currentWC)],
  previousWC: [],
};

const lidoKey: LidoKey = {
  key: '0xb9cb5f6d464ef72e25fa9b69f87a782eaf60418d0e85344c979b101cf3dcfc5aa68eb85ade0ea99c2af15c39712fc524',
  depositSignature:
    '0xb7b225f21eb951bb3a3265b6574e84815dcceed50df3bd303440e5ea119cab5bd43775bf3b17c173f7f44d207f118ba309357de630c3fa452ef6267ae5bc4e22debece861cdb5b5756250c6c2c65071cf42fba2e52bc0227e02e439f842489ae',
  used: true,
};

// typeof result = [Pubkey, boolean]
const result = validateLidoKeyForPossibleWC(
  possibleWC,
  lidoKey,
  CHAINS.Mainnet,
);
```

#### Multiple keys and multi-threaded use

```ts
import { CHAINS } from '@lido-nestjs/constants';
import {
  validateKeys,
  GENESIS_FORK_VERSION,
  KeyWithWC,
} from '@lido-nestjs/key-validation';

const key: KeyWithWC = {
  key: '0xb9cb5f6d464ef72e25fa9b69f87a782eaf60418d0e85344c979b101cf3dcfc5aa68eb85ade0ea99c2af15c39712fc524',
  depositSignature:
    '0xb7b225f21eb951bb3a3265b6574e84815dcceed50df3bd303440e5ea119cab5bd43775bf3b17c173f7f44d207f118ba309357de630c3fa452ef6267ae5bc4e22debece861cdb5b5756250c6c2c65071cf42fba2e52bc0227e02e439f842489ae',
  wc: '0x010000000000000000000000b9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
};

const result = await validateKeys([key], GENESIS_FORK_VERSION[CHAINS.Mainnet], {
  multithreaded: true,
});

const isValid = result[1];
```

### Nest.js usage

#### Global usage

```ts
import { Module } from '@nestjs/common';
import { CHAINS } from '@lido-nestjs/constants';
import {
  LidoKeyValidatorModule,
  LidoKeyValidatorInterface,
} from '@lido-nestjs/key-validation';

@Module({
  imports: [LidoKeyValidatorModule.forRoot({ multithreaded: true })],
  providers: [MyService],
})
export class MyModule {}

export class MyService {
  public constructor(
    protected readonly keyValidator: LidoKeyValidatorInterface,
  ) {}

  public async someMethod() {
    const lidoKey: LidoKey = {
      key: '0xb9cb5f6d464ef72e25fa9b69f87a782eaf60418d0e85344c979b101cf3dcfc5aa68eb85ade0ea99c2af15c39712fc524',
      depositSignature:
        '0xb7b225f21eb951bb3a3265b6574e84815dcceed50df3bd303440e5ea119cab5bd43775bf3b17c173f7f44d207f118ba309357de630c3fa452ef6267ae5bc4e22debece861cdb5b5756250c6c2c65071cf42fba2e52bc0227e02e439f842489ae',
      used: true,
    };

    const result = await this.keyValidator.validateKey(lidoKey, CHAINS.Mainnet);
  }
}
```
