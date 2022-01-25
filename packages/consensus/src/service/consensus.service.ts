import { Injectable } from '@nestjs/common';
import { FetchService } from '@lido-nestjs/fetch';
import { ConsensusBaseService } from './base.service';
import { ConsensusBeaconService } from './beacon.service';
import { ConsensusDebugService } from './debug.service';
import { ConsensusNodeService } from './node.service';
import { ConsensusConfigService } from './config.service';
import { ConsensusValidatorService } from './validator.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null),
      );
    });
  });
}

@Injectable()
export class ConsensusService {
  constructor(protected fetchService: FetchService) {}
}

export interface ConsensusService
  extends ConsensusBaseService,
    ConsensusBeaconService,
    ConsensusDebugService,
    ConsensusNodeService,
    ConsensusConfigService,
    ConsensusValidatorService {}

applyMixins(ConsensusService, [
  ConsensusBaseService,
  ConsensusBeaconService,
  ConsensusDebugService,
  ConsensusNodeService,
  ConsensusConfigService,
  ConsensusValidatorService,
]);
