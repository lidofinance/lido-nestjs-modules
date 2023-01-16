import { Injectable } from '@nestjs/common';
import { ConsensusService } from '@lido-nestjs/consensus';
import { ValidatorsRegistryInterface, BlockId } from './interfaces';
import {
  BlockHeader,
  Validator,
  ConsensusMeta,
  ConsensusValidatorsAndMetadata,
} from './types';
import { StorageServiceInterface } from './storage';

@Injectable()
export class ValidatorsRegistry implements ValidatorsRegistryInterface {
  public constructor(
    protected readonly consensusService: ConsensusService,
    protected readonly storageService: StorageServiceInterface,
  ) {}

  /**
   * @inheritDoc
   */
  public async getMeta(): Promise<ConsensusMeta | null> {
    return this.storageService.getConsensusMeta();
  }

  /**
   * @inheritDoc
   */
  public async getValidators(
    pubkeys?: string[],
  ): Promise<ConsensusValidatorsAndMetadata> {
    return this.storageService.getValidatorsAndMeta(pubkeys);
  }

  protected isNewDataInConsensus(
    previousMeta: ConsensusMeta | null,
    currentBlockHeader: BlockHeader,
  ): boolean {
    return previousMeta === null || previousMeta.slot < currentBlockHeader.slot;
  }

  /**
   * @inheritDoc
   */
  public async update(blockId: BlockId): Promise<ConsensusMeta | null> {
    const previousMeta = await this.storageService.getConsensusMeta();
    const blockHeader = await this.getSlotHeaderFromConsensus(blockId);

    if (!this.isNewDataInConsensus(previousMeta, blockHeader)) {
      return null;
    }

    const consensusMeta = await this.getConsensusMetaFromConsensus(
      blockHeader.root,
    );

    const validators = await this.getValidatorsFromConsensus(
      consensusMeta.slotStateRoot,
    );

    await this.storageService.updateValidatorsAndMeta(
      validators,
      consensusMeta,
    );

    return consensusMeta;
  }

  protected async getValidatorsFromConsensus(
    slotRoot: string,
  ): Promise<Validator[]> {
    const validatorsData = await this.consensusService.getStateValidators({
      stateId: slotRoot,
    });

    const validators = validatorsData?.data;

    if (!Array.isArray(validators)) {
      throw new RangeError('Validators must be array');
    }

    return validators.map((validator) => {
      // runtime type check
      /* istanbul ignore next */
      return Validator.parse({
        pubkey: validator.validator?.pubkey,
        index: validator.index,
        status: validator.status,
      });
    });
  }

  protected async getSlotHeaderFromConsensus(
    blockId: BlockId,
  ): Promise<BlockHeader> {
    const header = await this.consensusService.getBlockHeader({
      blockId: blockId.toString(),
    });

    /* istanbul ignore next */
    const root = header?.data?.root;
    /* istanbul ignore next */
    const slot = header?.data?.header?.message?.slot;

    /**
     * TODO Should we have an option to check `execution_optimistic === false`
     */

    // runtime type check
    return BlockHeader.parse({
      root,
      slot,
    });
  }

  protected async getConsensusMetaFromConsensus(
    blockId: string,
  ): Promise<ConsensusMeta> {
    const block = await this.consensusService.getBlockV2({
      blockId: blockId,
    });

    /* istanbul ignore next */
    const beaconBlockBody = block?.data?.message?.body;
    const executionPayload =
      beaconBlockBody && 'execution_payload' in beaconBlockBody
        ? beaconBlockBody.execution_payload
        : null;

    /* istanbul ignore next */
    const slotStateRoot = block?.data?.message?.state_root;
    /* istanbul ignore next */
    const slot = block?.data?.message?.slot;
    /* istanbul ignore next */
    const blockNumber = executionPayload?.block_number;
    /* istanbul ignore next */
    const blockHash = executionPayload?.block_hash;
    /* istanbul ignore next */
    const timestamp = executionPayload?.timestamp;

    // runtime type check
    return ConsensusMeta.parse({
      slot,
      slotStateRoot,
      blockNumber,
      blockHash,
      timestamp,
    });
  }
}
