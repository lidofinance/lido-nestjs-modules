import { ConsensusMethodResult } from '../interfaces';
import { ConsensusBaseService } from './base.service';

export class ConsensusEventsService extends ConsensusBaseService {
  /** Provides endpoint to subscribe to beacon node Consensus-Sent-Events stream. */
  public async eventstream(): ConsensusMethodResult<'eventstream'> {
    throw new Error('Method is not implemented');
  }
}
