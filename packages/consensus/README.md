# Consensus Layer API Module

NestJS Consensus Layer API Module for Lido Finance projects.
Part of [Lido NestJS Modules](https://github.com/lidofinance/lido-nestjs-modules/#readme)

## Install

```bash
yarn add @lido-nestjs/consensus
```

## Update types

The types used in the API methods are based on [Eth2Spec](https://ethereum.github.io/beacon-APIs/). To update them use the script:

```bash
./generate.sh
```

## Usage

```ts
// Import
import { Module } from '@nestjs/common';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { MyService } from './my.service';

@Module({
  imports: [ConsensusModule.forFeature()],
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

### Global module

```ts
import { Module } from '@nestjs/common';
import { ConsensusModule } from '@lido-nestjs/consensus';

@Module({
  imports: [ConsensusModule.forRoot()],
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
- [getBlockHeaders](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockHeaders)
- [getBlockHeader](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockHeader)
- [publishBlock](https://ethereum.github.io/beacon-APIs/#/Beacon/publishBlock)
- [getBlock](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlock)
- [getBlockV2](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockV2)
- [getBlockRoot](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockRoot)
- [getBlockAttestations](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockAttestations)
- [getPoolAttestations](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolAttestations)
- [submitPoolAttestations](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolAttestations)
- [getPoolAttesterSlashings](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolAttesterSlashings)
- [submitPoolAttesterSlashings](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolAttesterSlashings)
- [getPoolProposerSlashings](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolProposerSlashings)
- [submitPoolProposerSlashings](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolProposerSlashings)
- [submitPoolSyncCommitteeSignatures](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolSyncCommitteeSignatures)
- [getPoolVoluntaryExits](https://ethereum.github.io/beacon-APIs/#/Beacon/getPoolVoluntaryExits)
- [submitPoolVoluntaryExit](https://ethereum.github.io/beacon-APIs/#/Beacon/submitPoolVoluntaryExit)

### Config

- [getForkSchedule](https://ethereum.github.io/beacon-APIs/#/Config/getForkSchedule)
- [getSpec](https://ethereum.github.io/beacon-APIs/#/Config/getSpec)
- [getDepositContract](https://ethereum.github.io/beacon-APIs/#/Config/getDepositContract)

### Debug

- [getState](https://ethereum.github.io/beacon-APIs/#/Debug/getState)
- [getStateV2](https://ethereum.github.io/beacon-APIs/#/Debug/getStateV2)
- [getDebugChainHeads](https://ethereum.github.io/beacon-APIs/#/Debug/getDebugChainHeads)

### Events

- [eventstream](https://ethereum.github.io/beacon-APIs/#/Events/eventstream)

### Node

- [getNetworkIdentity](https://ethereum.github.io/beacon-APIs/#/Node/getNetworkIdentity)
- [getPeers](https://ethereum.github.io/beacon-APIs/#/Node/getPeers)
- [getPeer](https://ethereum.github.io/beacon-APIs/#/Node/getPeer)
- [getPeerCount](https://ethereum.github.io/beacon-APIs/#/Node/getPeerCount)
- [getNodeVersion](https://ethereum.github.io/beacon-APIs/#/Node/getNodeVersion)
- [getSyncingStatus](https://ethereum.github.io/beacon-APIs/#/Node/getSyncingStatus)
- [getHealth](https://ethereum.github.io/beacon-APIs/#/Node/getHealth)

### Validator

- [getAttesterDuties](https://ethereum.github.io/beacon-APIs/#/Validator/getAttesterDuties)
- [getProposerDuties](https://ethereum.github.io/beacon-APIs/#/Validator/getProposerDuties)
- [getSyncCommitteeDuties](https://ethereum.github.io/beacon-APIs/#/Validator/getSyncCommitteeDuties)
- [produceBlock](https://ethereum.github.io/beacon-APIs/#/Validator/produceBlock)
- [produceBlockV2](https://ethereum.github.io/beacon-APIs/#/Validator/produceBlockV2)
- [produceAttestationData](https://ethereum.github.io/beacon-APIs/#/Validator/produceAttestationData)
- [getAggregatedAttestation](https://ethereum.github.io/beacon-APIs/#/Validator/getAggregatedAttestation)
- [publishAggregateAndProofs](https://ethereum.github.io/beacon-APIs/#/Validator/publishAggregateAndProofs)
- [prepareBeaconCommitteeSubnet](https://ethereum.github.io/beacon-APIs/#/Validator/prepareBeaconCommitteeSubnet)
- [prepareSyncCommitteeSubnets](https://ethereum.github.io/beacon-APIs/#/Validator/prepareSyncCommitteeSubnets)
- [produceSyncCommitteeContribution](https://ethereum.github.io/beacon-APIs/#/Validator/produceSyncCommitteeContribution)
- [publishContributionAndProofs](https://ethereum.github.io/beacon-APIs/#/Validator/publishContributionAndProofs)