import { Inject, Injectable, Optional } from '@nestjs/common';
import { FetchService } from '@lido-nestjs/fetch';
import { ConsensusBaseService } from './base.service';
import { ConsensusBeaconService } from './beacon.service';
import { ConsensusDebugService } from './debug.service';
import { ConsensusEventsService } from './events.service';
import { ConsensusNodeService } from './node.service';
import { ConsensusConfigService } from './config.service';
import { ConsensusValidatorService } from './validator.service';
import { CONSENSUS_OPTIONS_TOKEN } from '../consensus.constants';
import { ConsensusModuleOptions } from '../interfaces/module.interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        /* istanbul ignore next */
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null),
      );
    });
  });
}

@Injectable()
export class ConsensusService {
  constructor(
    @Optional()
    @Inject(CONSENSUS_OPTIONS_TOKEN)
    public options: ConsensusModuleOptions,

    protected fetchService: FetchService,
  ) {}
}

export interface ConsensusService
  extends ConsensusBaseService,
    ConsensusBeaconService,
    ConsensusDebugService,
    ConsensusEventsService,
    ConsensusNodeService,
    ConsensusConfigService,
    ConsensusValidatorService {}

applyMixins(ConsensusService, [
  ConsensusBaseService,
  ConsensusBeaconService,
  ConsensusDebugService,
  ConsensusEventsService,
  ConsensusNodeService,
  ConsensusConfigService,
  ConsensusValidatorService,
]);
