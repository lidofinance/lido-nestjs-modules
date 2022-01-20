import { Injectable } from '@nestjs/common';
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
export class ConsensusService {}
export interface ConsensusService
  extends ConsensusBeaconService,
    ConsensusDebugService,
    ConsensusNodeService,
    ConsensusConfigService,
    ConsensusValidatorService {}

applyMixins(ConsensusService, [
  ConsensusBeaconService,
  ConsensusDebugService,
  ConsensusNodeService,
  ConsensusConfigService,
  ConsensusValidatorService,
]);
