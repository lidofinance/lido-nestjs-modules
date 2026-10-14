# Validators registry Module

NestJS Validators registry Module for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/validators-registry
```

**`@lido-nestjs/consensus` 2.0.0 or later is required.** Since the Gloas fork the module reads the
execution payload of a block from `getSignedExecutionPayloadEnvelope`, and earlier versions of that
package do not have that method.

The app registers `ConsensusModule` itself, as the usage below shows, so the app and this module
have to end up on one copy of `@lido-nestjs/consensus`. Nest looks a provider up by its class, so
two copies in `node_modules` give two `ConsensusService` classes that are not the same thing, and
Nest cannot resolve the dependencies of `ValidatorsRegistry`.

## Interface

Package exports `ValidatorsRegistry` that implements the following interface:

```typescript
export interface ValidatorsRegistryInterface {
  /**
   * Update internal state of validators in the registry to the Consensus Layer (CL) state
   * according to `blockId`.
   *
   * @param {BlockId} blockId - Values: 'head', 'genesis', 'finalized', <slot>, <hex encoded blockRoot with 0x prefix>
   *
   * If the registry internal state is newer or the same to the CL state - does nothing.
   */
  update(blockId: BlockId): Promise<ConsensusMeta>;

  /**
   * Get Metadata from registry internal state
   */
  getMeta(): Promise<ConsensusMeta | null>;

  /**
   * Get Validators and metadata from registry internal state
   */
  getValidators(
    pubkeys?: string[],
    where?: FilterQuery<ConsensusValidatorEntity>,
    options?: FindOptions<ConsensusValidatorEntity>,
  ): Promise<ConsensusValidatorsAndMetadata>;
}
```

## Usage

```typescript
// my.module.ts
import { Module } from '@nestjs/common';
import {
  StorageModule,
  ValidatorsRegistryModule,
} from '@lido-nestjs/validators-registry';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { MyService } from './my.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: ':memory:',
      type: 'sqlite',
      entities: [...StorageModule.entities], // optional
      migrations: {
        /* migrations data */
      },
    }),
    FetchModule.forRoot({
      baseUrls: ['http://consensus-node:4001'],
    }),
    ConsensusModule.forRoot(),
    ValidatorsRegistryModule.forFeature(),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// my.service.ts
import { Injectable } from '@nestjs/common';
import { ValidatorsRegistryInterface } from '@lido-nestjs/validators-registry';

@Injectable()
export class MyService {
  public constructor(
    private readonly validatorsRegistry: ValidatorsRegistryInterface,
  ) {}

  public async myMethod() {
    await this.validatorsRegistry.update('finalized');

    const metaAndValidators = await this.validatorsRegistry.getValidators();

    return metaAndValidators;
  }
}
```

## Options

`forRoot`, `forFeature` and their async variants take the following options:

| Option                 | Default | Description                                                                                                                                                            |
| ---------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payloadLookbackDepth` | `32`    | How many blocks back to walk when looking for the execution payload the beacon state already has. Only used since the Gloas fork, see below. Counts blocks, not slots. |

```typescript
ValidatorsRegistryModule.forFeature({ payloadLookbackDepth: 8 });
```

`payloadLookbackDepth` has to be a positive integer. Anything else throws while the module is being
created, so the application stops at startup instead of on the first `update` after the fork.

## The Gloas fork (EIP-7732)

Up to Fulu a beacon block carries its execution payload, so `blockNumber`, `blockHash` and
`timestamp` of `ConsensusMeta` were read straight from the block.

Since Gloas the block only commits to a bid, and the builder reveals the payload later in the slot,
in an envelope of its own. The payload is then applied to the state while the **next** block is
being processed, so the state a `ConsensusMeta` describes never holds the payload of its own slot.
The registry reports the payload that state really has, so that the validators and the execution
layer block of a `ConsensusMeta` always belong together.

That payload is normally the one of the parent block. Missed slots leave the parent further back,
and a builder that did not reveal its payload in time takes the payload further back than the
parent: both leave the execution layer data older than the slot it is reported with. The new
`payloadSlot` field of `ConsensusMeta` tells which slot the payload belongs to. It stays empty up
to Fulu, where the payload always belongs to the slot itself.

### What this means for code that reads `ConsensusMeta`

Two habits that were safe up to Fulu are not safe any more.

**`timestamp` is no longer the time of `slot`.** It is the time of `payloadSlot`, so it is at least
one slot behind the slot it comes with. Code that used it as the time of the slot has to take that
from the slot number itself.

**`blockNumber`, `blockHash` and `timestamp` can repeat.** Two updates at different slots can report
the same execution layer block, because a slot may add no execution layer block at all. Code that
reads "a new slot" as "a new execution layer block" breaks on this. `slot` always moves forward,
`blockNumber` does not.

Here is how a short run around the fork looks. `blockNumber` stands still twice, for two different
reasons: at the fork, because from there on the state of a block no longer holds the payload of its
own slot, and after the slot whose builder was too late, which added no execution layer block at
all.

| Block | What happened                       | `slot` | `payloadSlot` | `blockNumber` |
| ----- | ----------------------------------- | ------ | ------------- | ------------- |
| 100   | the last block before the fork      | 100    | —             | 50            |
| 101   | the first block of the fork         | 101    | 100           | 50            |
| 102   | the payload of 101 was revealed     | 102    | 101           | 51            |
| 103   | the payload of 102 was not revealed | 103    | 101           | 51            |
| 104   | the payload of 103 was revealed     | 104    | 103           | 52            |

Finding the payload means walking the ancestors back, and `payloadLookbackDepth` bounds that walk.
The payload itself is then read from the envelope of the block it belongs to, through
`getSignedExecutionPayloadEnvelope` of `@lido-nestjs/consensus` 2.0.0. A walk that ends before the
fork reads it off the block instead: the last Fulu block carries its payload, and no envelope was
ever published for it.

### Errors

`ExecutionPayloadNotFoundError` is thrown when either step comes up empty: the walk found no block
holding that payload, or the node had no envelope to give for the block that does. Both normally
point at the node rather than at a depth set too low. It either follows another branch of the
chain, or keeps no envelopes that old.

Everything else is passed through as it is, **including the `HttpException` that
`@lido-nestjs/fetch` throws for an answer that is not 2xx**. A timeout or a 500 says nothing about
the payload, so turning it into a registry error would hide a real problem. The blocks the walk
reads are left alone the same way: a node that does not know the ancestor root it is asked about
answers 404, and that `HttpException` reaches the caller unchanged. So code that catches
`ExecutionPayloadNotFoundError` has to be ready for a raw `HttpException` as well.

### Set a retry policy when you pass more than one node

`@lido-nestjs/fetch` moves to the next entry of `baseUrls` on every **retry**, and its default is
`attempts: 0` — no retries at all. With that default only the first url is ever asked, whatever
else is in the list.

Since Gloas that costs more than it used to. One node can be the only one missing the envelope for
a block, and its 404 then becomes `ExecutionPayloadNotFoundError` as if the whole fleet had
answered. Set `attempts` to at least `baseUrls.length - 1`, so that every node is asked before the
registry gives up:

```typescript
FetchModule.forRoot({
  baseUrls: ['http://node-1:4001', 'http://node-2:4001', 'http://node-3:4001'],
  retryPolicy: { attempts: 2, delay: 1000 },
});
```

## Migrations

Database migrations are placed in `./src/migrations/` folder.

Please DO NOT edit migrations, if you want to change the migration,
please make another one with the needed database schema transitions.

`Migration20240221083613` and `Migration20260915120100` only move the primary key of
`consensus_meta` around and use syntax SQLite does not support. Leave both out when running the
package migrations on SQLite: `Migration20221225154138` already creates the table with the key they
end up with.
