# Consensus Layer API Module

NestJS Consensus Layer API Module for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/consensus
```

## Update types

The types used in the API methods are based on [Eth2Spec](https://ethereum.github.io/beacon-APIs/), release `v5.0.0-beta.0` (consensus-specs `v1.7.0-beta`, Gloas included). To update them use the script:

```bash
./generate.sh
```

## Usage

This module depends on `FetchModule` from `@lido-nestjs/fetch`, so you need to provide it as a global module or import it into `ConsensusModule`.

```ts
// Import
import { Module } from '@nestjs/common';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { MyService } from './my.service';

@Module({
  imports: [ConsensusModule.forFeature({ imports: [FetchModule] })],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { ConsensusService } from '@lido-nestjs/consensus';

export class MyService {
  constructor(private consensusService: ConsensusService) {}

  async myMethod() {
    return await this.consensusService.getGenesis();
  }
}
```

### Global usage

```ts
import { Module } from '@nestjs/common';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';

@Module({
  imports: [FetchModule.forRoot(), ConsensusModule.forRoot()],
})
export class MyModule {}
```

### Async usage

```ts
import { Module } from '@nestjs/common';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { ConfigModule, ConfigService } from './my.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FetchModule.forRoot(),
    ConsensusModule.forRootAsync({
      async useFactory(configService: ConfigService) {
        return { pollingInterval: configService.pollingInterval };
      },
      inject: [ConfigService],
    }),
  ],
})
export class MyModule {}
```

### Fetch options

Methods support fetch `options`:

```ts
// Usage
import { ConsensusService } from '@lido-nestjs/consensus';

export class MyService {
  constructor(private consensusService: ConsensusService) {}

  async myMethod() {
    return await this.consensusService.getGenesis({
      options: { headers: { 'x-header-foo': 'bar' } },
    });
  }
}
```

### Subscription

Subscribe to head blocks:

```ts
import { ConsensusService } from '@lido-nestjs/consensus';

export class MyService {
  constructor(private consensusService: ConsensusService) {
    this.consensusService.subscribe((error, data) => {
      console.log(error, data);
    });
  }
}
```

Subscribe to finalized blocks:

```ts
import { ConsensusService } from '@lido-nestjs/consensus';

export class MyService {
  constructor(private consensusService: ConsensusService) {
    this.consensusService.subscribe(
      (error, data) => {
        console.log(error, data);
      },
      { blockId: 'finalized' },
    );
  }
}
```

## Forks

`getBlockV2` and `getStateV2` change shape from fork to fork. Their result is a union of the fork shapes, told apart by `version`. `ConsensusMethodResult<'getBlockV2'>` and `ConsensusMethodResult<'getStateV2'>` have the same type. A field that is not in every fork is a build error until you narrow the type:

```ts
import {
  ConsensusService,
  hasExecutionPayload,
  hasExecutionPayloadBid,
} from '@lido-nestjs/consensus';

export class MyService {
  constructor(private consensusService: ConsensusService) {}

  async blockHash(slot: number) {
    const block = await this.consensusService.getBlockV2({
      blockId: String(slot),
    });

    // Build error: Gloas blocks have no execution_payload
    // block.data.message.body.execution_payload.block_hash;

    if (hasExecutionPayload(block)) {
      // bellatrix to fulu
      return block.data.message.body.execution_payload.block_hash;
    }
    if (hasExecutionPayloadBid(block)) {
      // gloas: the block only commits to a payload
      return block.data.message.body.signed_execution_payload_bid.message
        .block_hash;
    }
    if (block.version === 'phase0' || block.version === 'altair') return null;

    throw new Error(`Unsupported fork ${block.version}`);
  }
}
```

A fork this version of the package does not know matches no guard, so keep a branch that fails for it.

`block.version` is the fork of the block, so no fork schedule is needed. To compare forks, use `isForkAtLeast(block.version, 'gloas')`.

### Gloas (EIP-7732)

From the Gloas fork on the block body has no `execution_payload`. It has `signed_execution_payload_bid`: the hash, fee recipient and value the builder committed to. The builder reveals the payload later in a separate envelope, `getSignedExecutionPayloadEnvelope`. The payload may never be revealed.

The payload of block N is canonical when the next block builds on it: the next block's `bid.parent_block_hash` equals block N's `bid.block_hash`. A found envelope is not enough, some clients serve envelopes of late payloads that were orphaned.

Values in the bid (`value`, `execution_payment`) are in Gwei.

## Methods

### Beacon

- [getGenesis](https://ethereum.github.io/beacon-APIs/#/Beacon/getGenesis)
- [getStateRoot](https://ethereum.github.io/beacon-APIs/#/Beacon/getStateRoot)
- [getStateFork](https://ethereum.github.io/beacon-APIs/#/Beacon/getStateFork)
- [getStateFinalityCheckpoints](https://ethereum.github.io/beacon-APIs/#/Beacon/getStateFinalityCheckpoints)
- [getStateValidators](https://ethereum.github.io/beacon-APIs/#/Beacon/getStateValidators)
- [getStateValidator](https://ethereum.github.io/beacon-APIs/#/Beacon/getStateValidator)
- [getStateValidatorBalances](https://ethereum.github.io/beacon-APIs/#/Beacon/getStateValidatorBalances)
- [getEpochCommittees](https://ethereum.github.io/beacon-APIs/#/Beacon/getEpochCommittees)
- [getEpochSyncCommittees](https://ethereum.github.io/beacon-APIs/#/Beacon/getEpochSyncCommittees)
- [getProposerLookahead](https://ethereum.github.io/beacon-APIs/#/Beacon/getProposerLookahead)
- [getBlockHeaders](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockHeaders)
- [getBlockHeader](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockHeader)
- [publishBlockV2](https://ethereum.github.io/beacon-APIs/#/Beacon/publishBlockV2)
- [publishBlindedBlockV2](https://ethereum.github.io/beacon-APIs/#/Beacon/publishBlindedBlockV2)
- [getBlockV2](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockV2)
- [getBlockRoot](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockRoot)
- [getBlockAttestationsV2](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockAttestationsV2)
- [getPoolAttestationsV2](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolAttestationsV2)
- [submitPoolAttestationsV2](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolAttestationsV2)
- [getPoolAttesterSlashingsV2](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolAttesterSlashingsV2)
- [submitPoolAttesterSlashingsV2](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolAttesterSlashingsV2)
- [getPoolProposerSlashings](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolProposerSlashings)
- [submitPoolProposerSlashings](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolProposerSlashings)
- [submitPoolSyncCommitteeSignatures](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolSyncCommitteeSignatures)
- [getPoolVoluntaryExits](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolVoluntaryExits)
- [submitPoolVoluntaryExit](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolVoluntaryExit)
- [getStateBuilders](https://ethereum.github.io/beacon-APIs/#/Beacon/getStateBuilders) (Glamsterdam / Gloas)
- [getBuilderPendingPayments](https://ethereum.github.io/beacon-APIs/#/Beacon/getBuilderPendingPayments) (Glamsterdam / Gloas)
- [getBuilderPendingWithdrawals](https://ethereum.github.io/beacon-APIs/#/Beacon/getBuilderPendingWithdrawals) (Glamsterdam / Gloas)
- [getStatePtc](https://ethereum.github.io/beacon-APIs/#/Beacon/getStatePtc) (Glamsterdam / Gloas)
- [getProposerPreferences](https://ethereum.github.io/beacon-APIs/#/Beacon/getProposerPreferences) (Glamsterdam / Gloas)
- [publishExecutionPayloadEnvelope](https://ethereum.github.io/beacon-APIs/#/Beacon/publishExecutionPayloadEnvelope) (Glamsterdam / Gloas)
- [getPoolPayloadAttestations](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolPayloadAttestations) (Glamsterdam / Gloas)
- [submitPayloadAttestationMessages](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPayloadAttestationMessages) (Glamsterdam / Gloas)
- [getSignedExecutionPayloadEnvelope](https://ethereum.github.io/beacon-APIs/#/Beacon/getSignedExecutionPayloadEnvelope) (Glamsterdam / Gloas)
- [publishExecutionPayloadBid](https://ethereum.github.io/beacon-APIs/#/Beacon/publishExecutionPayloadBid) (Glamsterdam / Gloas)

### Config

- [getForkSchedule](https://ethereum.github.io/beacon-APIs/#/Config/getForkSchedule)
- [getSpec](https://ethereum.github.io/beacon-APIs/#/Config/getSpec)
- [getDepositContract](https://ethereum.github.io/beacon-APIs/#/Config/getDepositContract)

### Debug

- [getStateV2](https://ethereum.github.io/beacon-APIs/#/Debug/getStateV2)
- [getDebugChainHeadsV2](https://ethereum.github.io/beacon-APIs/#/Debug/getDebugChainHeadsV2)
- [getDebugForkChoiceV2](https://ethereum.github.io/beacon-APIs/#/Debug/getDebugForkChoiceV2)

### Events

- [eventstream](https://ethereum.github.io/beacon-APIs/#/Events/eventstream)

### Node

- [getNetworkIdentity](https://ethereum.github.io/beacon-APIs/#/Node/getNetworkIdentity)
- [getPeers](https://ethereum.github.io/beacon-APIs/#/Node/getPeers)
- [getPeer](https://ethereum.github.io/beacon-APIs/#/Node/getPeer)
- [getPeerCount](https://ethereum.github.io/beacon-APIs/#/Node/getPeerCount)
- [getNodeVersion](https://ethereum.github.io/beacon-APIs/#/Node/getNodeVersion)
- [getNodeVersionV2](https://ethereum.github.io/beacon-APIs/#/Node/getNodeVersionV2)
- [getSyncingStatus](https://ethereum.github.io/beacon-APIs/#/Node/getSyncingStatus)
- [getHealth](https://ethereum.github.io/beacon-APIs/#/Node/getHealth)

### Validator

- [getAttesterDuties](https://ethereum.github.io/beacon-APIs/#/Validator/getAttesterDuties)
- [getProposerDuties](https://ethereum.github.io/beacon-APIs/#/Validator/getProposerDuties)
- [getProposerDutiesV2](https://ethereum.github.io/beacon-APIs/#/Validator/getProposerDutiesV2)
- [getPtcDuties](https://ethereum.github.io/beacon-APIs/#/Validator/getPtcDuties) (Glamsterdam / Gloas)
- [getSyncCommitteeDuties](https://ethereum.github.io/beacon-APIs/#/Validator/getSyncCommitteeDuties)
- [getAggregatedAttestationV2](https://ethereum.github.io/beacon-APIs/#/Validator/getAggregatedAttestationV2)
- [produceBlockV3](https://ethereum.github.io/beacon-APIs/#/Validator/produceBlockV3)
- [produceAttestationData](https://ethereum.github.io/beacon-APIs/#/Validator/produceAttestationData)
- [producePayloadAttestationData](https://ethereum.github.io/beacon-APIs/#/Validator/producePayloadAttestationData) (Glamsterdam / Gloas)
- [produceBlockV4](https://ethereum.github.io/beacon-APIs/#/Validator/produceBlockV4) (Glamsterdam / Gloas)
- [getExecutionPayloadEnvelope](https://ethereum.github.io/beacon-APIs/#/Validator/getExecutionPayloadEnvelope) (Glamsterdam / Gloas)
- [submitProposerPreferences](https://ethereum.github.io/beacon-APIs/#/Validator/submitProposerPreferences) (Glamsterdam / Gloas)
- [submitBuilderPreferences](https://ethereum.github.io/beacon-APIs/#/Validator/submitBuilderPreferences) (Glamsterdam / Gloas)
- [publishAggregateAndProofsV2](https://ethereum.github.io/beacon-APIs/#/Validator/publishAggregateAndProofsV2)
- [prepareBeaconCommitteeSubnet](https://ethereum.github.io/beacon-APIs/#/Validator/prepareBeaconCommitteeSubnet)
- [prepareSyncCommitteeSubnets](https://ethereum.github.io/beacon-APIs/#/Validator/prepareSyncCommitteeSubnets)
- [produceSyncCommitteeContribution](https://ethereum.github.io/beacon-APIs/#/Validator/produceSyncCommitteeContribution)
- [publishContributionAndProofs](https://ethereum.github.io/beacon-APIs/#/Validator/publishContributionAndProofs)
