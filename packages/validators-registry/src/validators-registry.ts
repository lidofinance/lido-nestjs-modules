import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConsensusService } from '@lido-nestjs/consensus';
import { ValidatorsRegistryInterface, BlockId } from './interfaces';
import { ValidatorsRegistryModuleOptions } from './interfaces/module.interface';
import {
  BlockHeader,
  Validator,
  ConsensusMeta,
  ConsensusValidatorsAndMetadata,
  Slot,
} from './types';
import { FindOptions, FilterQuery, StorageServiceInterface } from './storage';
import {
  parseAsTypeOrFail,
  calcEpochBySlot,
  AppliedExecutionPayload,
  BeaconBlockBody,
  BeaconBlockMessage,
  getAppliedExecutionBlockHash,
  getEnvelopePayload,
  getInlineExecutionPayload,
  getOwnExecutionBlockHash,
} from './utils';
import {
  ConsensusDataInvalidError,
  ExecutionPayloadNotFoundError,
} from './errors';
import { ConsensusValidatorEntity } from './storage/consensus-validator.entity';
import { EntityManager } from '@mikro-orm/knex';
import { processValidatorsStream } from './utils/validators.stream';
import { IsolationLevel } from '@mikro-orm/core';
import {
  VALIDATORS_REGISTRY_DEFAULT_PAYLOAD_LOOKBACK_DEPTH,
  VALIDATORS_REGISTRY_OPTIONS_TOKEN,
} from './constants';

@Injectable()
export class ValidatorsRegistry implements ValidatorsRegistryInterface {
  public constructor(
    protected readonly consensusService: ConsensusService,
    protected readonly storageService: StorageServiceInterface,

    @Optional()
    @Inject(VALIDATORS_REGISTRY_OPTIONS_TOKEN)
    protected readonly options: ValidatorsRegistryModuleOptions | null = null,
  ) {}

  /**
   * How many blocks back to walk when looking for the execution payload that the state already has.
   */
  public get payloadLookbackDepth(): number {
    return (
      this.options?.payloadLookbackDepth ??
      VALIDATORS_REGISTRY_DEFAULT_PAYLOAD_LOOKBACK_DEPTH
    );
  }

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
    where?: FilterQuery<ConsensusValidatorEntity>,
    options?: FindOptions<ConsensusValidatorEntity>,
  ): Promise<ConsensusValidatorsAndMetadata> {
    return this.storageService.getValidatorsAndMeta(pubkeys, where, options);
  }

  protected isNewDataInConsensus(
    previousMeta: ConsensusMeta,
    currentBlockHeader: BlockHeader,
  ): boolean {
    return previousMeta.slot < currentBlockHeader.slot;
  }

  /**
   * @inheritDoc
   */
  public async update(blockId: BlockId): Promise<ConsensusMeta> {
    const previousMeta = await this.storageService.getConsensusMeta();
    const blockHeader = await this.getSlotHeaderFromConsensus(blockId);

    if (previousMeta && !this.isNewDataInConsensus(previousMeta, blockHeader)) {
      return previousMeta;
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

  public async updateStream(blockId: BlockId): Promise<ConsensusMeta> {
    const previousMeta = await this.storageService.getConsensusMeta();
    const blockHeader = await this.getSlotHeaderFromConsensus(blockId);

    if (previousMeta && !this.isNewDataInConsensus(previousMeta, blockHeader)) {
      return previousMeta;
    }

    const consensusMeta = await this.getConsensusMetaFromConsensus(
      blockHeader.root,
    );

    const em: EntityManager = this.storageService.getEntityManager();

    await em.transactional(
      async () => {
        const validators = await this.getValidatorsFromConsensusStream(
          consensusMeta.slotStateRoot,
        );

        await this.storageService.deleteValidators();
        await this.storageService.updateMeta(consensusMeta);

        const callback = (validatorsChunk: Validator[]) =>
          this.storageService.updateValidators(validatorsChunk);

        await processValidatorsStream(validators, callback);
      },
      { isolationLevel: IsolationLevel.READ_COMMITTED },
    );

    return consensusMeta;
  }

  protected async getValidatorsFromConsensusStream(
    slotRoot: string,
  ): Promise<NodeJS.ReadableStream> {
    const validatorsData: NodeJS.ReadableStream =
      await this.consensusService.getStateValidatorsStream({
        stateId: slotRoot,
      });

    return validatorsData;
  }

  protected async getValidatorsFromConsensus(
    slotRoot: string,
  ): Promise<Validator[]> {
    const validatorsData = await this.consensusService.getStateValidators({
      stateId: slotRoot,
    });

    const validators = validatorsData?.data;

    if (!Array.isArray(validators)) {
      throw new ConsensusDataInvalidError(`Validators must be array`);
    }

    return validators.map((validator) => {
      // runtime type check
      /* istanbul ignore next */
      return parseAsTypeOrFail(
        Validator,
        {
          pubkey: validator.validator?.pubkey,
          index: validator.index,
          status: validator.status,
        },
        (error) => {
          throw new ConsensusDataInvalidError(`Got invalid validators`, error);
        },
      );
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

    return parseAsTypeOrFail(
      BlockHeader,
      {
        root,
        slot,
      },
      (error) => {
        throw new ConsensusDataInvalidError(`Got invalid block header`, error);
      },
    );
  }

  protected async getConsensusMetaFromConsensus(
    blockId: string,
  ): Promise<ConsensusMeta> {
    const block = await this.consensusService.getBlockV2({
      blockId: blockId,
    });

    /* istanbul ignore next */
    const blockMessage = block?.data?.message;

    const executionPayload = await this.getAppliedExecutionPayload(
      blockMessage,
    );

    /* istanbul ignore next */
    const slot = parseAsTypeOrFail(Slot, blockMessage?.slot, (error) => {
      throw new ConsensusDataInvalidError(`Got invalid slot`, error);
    });

    const epoch = calcEpochBySlot(slot);

    /* istanbul ignore next */
    const slotStateRoot = blockMessage?.state_root;

    /* istanbul ignore next */
    return parseAsTypeOrFail(
      ConsensusMeta,
      {
        epoch,
        slot,
        slotStateRoot,
        ...executionPayload,
      },
      (error) => {
        throw new ConsensusDataInvalidError(`Got invalid ConsensusMeta`, error);
      },
    );
  }

  /**
   * The execution payload the beacon state of the block already has.
   *
   * Up to Fulu the block carries its payload, and it is applied within the same slot, so the answer is right there.
   *
   * Since Gloas (EIP-7732) the block only commits to a bid, and the builder reveals the payload later in the slot.
   * `process_parent_execution_payload` applies the payload of the parent while the block is being processed, so the
   * state of the block has the payload of an ancestor and never its own. The bid names that payload by its hash, and
   * the walk below finds the block it belongs to.
   */
  protected async getAppliedExecutionPayload(
    blockMessage?: BeaconBlockMessage,
  ): Promise<AppliedExecutionPayload> {
    if (!blockMessage?.body) {
      throw new ConsensusDataInvalidError(`No body data in a block`);
    }

    const body = blockMessage.body;
    const inlinePayload = getInlineExecutionPayload(body);

    if (inlinePayload) {
      return {
        blockNumber: inlinePayload.block_number,
        blockHash: inlinePayload.block_hash,
        timestamp: inlinePayload.timestamp,
      };
    }

    const appliedBlockHash = getAppliedExecutionBlockHash(body);

    if (!appliedBlockHash) {
      throw new ConsensusDataInvalidError(
        `No execution_payload and no signed_execution_payload_bid data in a block`,
      );
    }

    return await this.findAppliedExecutionPayload(
      appliedBlockHash,
      blockMessage.parent_root,
    );
  }

  /**
   * Walk the ancestors back until the block whose payload the state has is found.
   *
   * Following `parent_root` costs one request per proposed block and skips the missed slots for free. The walk
   * normally ends on the parent: it takes another step only when a builder did not reveal its payload in time, which
   * is rare and does not last long.
   */
  protected async findAppliedExecutionPayload(
    appliedBlockHash: string,
    parentRoot?: string,
  ): Promise<AppliedExecutionPayload> {
    let blockRoot = parentRoot;

    for (
      let depth = 0;
      depth < this.payloadLookbackDepth && blockRoot;
      depth++
    ) {
      const block = await this.consensusService.getBlockV2({
        blockId: blockRoot,
      });

      const blockMessage = block?.data?.message;

      if (!blockMessage?.body) {
        throw new ConsensusDataInvalidError(
          `No body data in a block [${blockRoot}]`,
        );
      }

      if (getOwnExecutionBlockHash(blockMessage.body) === appliedBlockHash) {
        return await this.getExecutionPayloadOfBlock(
          blockRoot,
          blockMessage.body,
          blockMessage.slot,
          appliedBlockHash,
        );
      }

      blockRoot = blockMessage.parent_root;
    }

    throw new ExecutionPayloadNotFoundError(
      `Execution payload [${appliedBlockHash}] applied to the state is not found ` +
        `within [${this.payloadLookbackDepth}] blocks back`,
      appliedBlockHash,
      this.payloadLookbackDepth,
    );
  }

  /**
   * The payload of the block the walk stopped at.
   *
   * The last block before the fork still carries its payload inline, and no envelope was ever published for it. Every
   * block after the fork keeps its payload in an envelope, which the node has, because it applied that payload to the
   * state before it answered about the block the walk started from.
   */
  protected async getExecutionPayloadOfBlock(
    blockRoot: string,
    body: BeaconBlockBody,
    payloadSlot: string | undefined,
    appliedBlockHash: string,
  ): Promise<AppliedExecutionPayload> {
    const inlinePayload = getInlineExecutionPayload(body);

    if (inlinePayload) {
      return {
        blockNumber: inlinePayload.block_number,
        blockHash: inlinePayload.block_hash,
        timestamp: inlinePayload.timestamp,
        payloadSlot,
      };
    }

    const envelope =
      await this.consensusService.getSignedExecutionPayloadEnvelope({
        blockId: blockRoot,
      });

    const payload = getEnvelopePayload(envelope);

    if (!payload) {
      throw new ConsensusDataInvalidError(
        `No execution payload in the envelope of a block [${blockRoot}]`,
      );
    }

    if (payload.block_hash !== appliedBlockHash) {
      throw new ConsensusDataInvalidError(
        `Envelope of a block [${blockRoot}] holds execution payload ` +
          `[${payload.block_hash}] instead of [${appliedBlockHash}]`,
      );
    }

    return {
      blockNumber: payload.block_number,
      blockHash: payload.block_hash,
      timestamp: payload.timestamp,
      payloadSlot,
    };
  }
}
