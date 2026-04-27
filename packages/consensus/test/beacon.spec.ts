import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';
import { Readable } from 'stream';

describe('Beacon endpoints', () => {
  let consensusService: ConsensusService;
  let fetchService: FetchService;
  let mockFetch: jest.SpyInstance<
    ReturnType<FetchService['fetchJson']>,
    Parameters<FetchService['fetchJson']>
  >;
  let mockFetchStream: jest.SpyInstance<
    ReturnType<FetchService['fetchStream']>,
    Parameters<FetchService['fetchStream']>
  >;

  beforeEach(async () => {
    const module = {
      imports: [ConsensusModule.forFeature({ imports: [FetchModule] })],
    };
    const moduleRef = await Test.createTestingModule(module).compile();
    consensusService = moduleRef.get(ConsensusService);
    fetchService = moduleRef.get(FetchService);

    mockFetch = jest
      .spyOn(fetchService, 'fetchJson')
      .mockImplementation(async () => null);

    mockFetchStream = jest
      .spyOn(fetchService, 'fetchStream')
      .mockImplementation(async () => Readable.from(Buffer.from('')));
  });

  test('getGenesis', async () => {
    await consensusService.getGenesis();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/beacon/genesis', undefined);
  });

  test('getStateRoot', async () => {
    await consensusService.getStateRoot({ stateId: 'head' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/root',
      undefined,
    );
  });

  test('getStateFork', async () => {
    await consensusService.getStateFork({ stateId: 'head' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/fork',
      undefined,
    );
  });

  test('getStateFinalityCheckpoints', async () => {
    await consensusService.getStateFinalityCheckpoints({ stateId: 'head' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/finality_checkpoints',
      undefined,
    );
  });

  test('getStateValidators', async () => {
    await consensusService.getStateValidators({
      stateId: 'head',
      id: ['1', '2'],
      status: ['active'],
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/validators?id=1%2C2&status=active',
      undefined,
    );
  });

  test('postStateValidators', async () => {
    await consensusService.postStateValidators({
      stateId: 'head',
      ids: ['1', '2'],
      statuses: ['active'],
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/beacon/states/head/validators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: ['1', '2'], statuses: ['active'] }),
    });
  });

  test('postStateValidators with custom headers', async () => {
    await consensusService.postStateValidators({
      stateId: 'head',
      ids: ['1', '2'],
      statuses: ['active'],
      options: {
        headers: {
          'X-Custom-Header': 'test-value',
        },
      },
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/beacon/states/head/validators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value',
      },
      body: JSON.stringify({ ids: ['1', '2'], statuses: ['active'] }),
    });
  });

  test('getStateValidatorsStream', async () => {
    await consensusService.getStateValidatorsStream({
      stateId: 'head',
      id: ['1', '2'],
      status: ['active'],
    });

    expect(mockFetchStream).toBeCalledTimes(1);
    expect(mockFetchStream).toBeCalledWith(
      '/eth/v1/beacon/states/head/validators?id=1%2C2&status=active',
      undefined,
    );
  });

  test('getStateValidator', async () => {
    await consensusService.getStateValidator({
      stateId: 'head',
      validatorId: '1',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/validators/1',
      undefined,
    );
  });

  test('getStateValidatorBalances', async () => {
    await consensusService.getStateValidatorBalances({
      stateId: 'head',
      id: ['1', '2'],
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/validator_balances?id=1%2C2',
      undefined,
    );
  });

  test('getEpochCommittees', async () => {
    await consensusService.getEpochCommittees({
      stateId: 'head',
      epoch: '1',
      index: '2',
      slot: '3',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/committees?epoch=1&index=2&slot=3',
      undefined,
    );
  });

  test('getEpochSyncCommittees', async () => {
    await consensusService.getEpochSyncCommittees({
      stateId: 'head',
      epoch: '1',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/sync_committees?epoch=1',
      undefined,
    );
  });

  test('getBlockHeaders', async () => {
    await consensusService.getBlockHeaders({ slot: '1', parentRoot: '2' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/headers?slot=1&parent_root=2',
      undefined,
    );
  });

  test('getBlockHeaders', async () => {
    await consensusService.getBlockHeaders();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/beacon/headers', undefined);
  });

  test('getBlockHeader', async () => {
    await consensusService.getBlockHeader({ blockId: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/beacon/headers/1', undefined);
  });

  test('publishBlockV2', async () => {
    await expect(consensusService.publishBlockV2()).rejects.toThrow();
  });

  test('publishBlindedBlockV2', async () => {
    await expect(consensusService.publishBlindedBlockV2()).rejects.toThrow();
  });

  test('getBlockV2', async () => {
    await consensusService.getBlockV2({ blockId: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v2/beacon/blocks/1', undefined);
  });

  test('getBlockRoot', async () => {
    await consensusService.getBlockRoot({ blockId: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/beacon/blocks/1/root', undefined);
  });

  test('getBlockAttestationsV2', async () => {
    await consensusService.getBlockAttestationsV2({ blockId: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/beacon/blocks/1/attestations',
      undefined,
    );
  });

  test('getPoolAttestationsV2', async () => {
    await consensusService.getPoolAttestationsV2({
      slot: '1',
      committeeIndex: '2',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/beacon/pool/attestations?slot=1&committee_index=2',
      undefined,
    );
  });

  test('getPoolAttestationsV2 without args', async () => {
    await consensusService.getPoolAttestationsV2();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/beacon/pool/attestations',
      undefined,
    );
  });

  test('submitPoolAttestationsV2', async () => {
    await expect(consensusService.submitPoolAttestationsV2()).rejects.toThrow();
  });

  test('getPoolAttesterSlashingsV2', async () => {
    await consensusService.getPoolAttesterSlashingsV2();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/beacon/pool/attester_slashings',
      undefined,
    );
  });

  test('submitPoolAttesterSlashingsV2', async () => {
    await expect(
      consensusService.submitPoolAttesterSlashingsV2(),
    ).rejects.toThrow();
  });

  test('getPoolPayloadAttestations with slot', async () => {
    await consensusService.getPoolPayloadAttestations({ slot: '42' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/pool/payload_attestations?slot=42',
      undefined,
    );
  });

  test('getPoolPayloadAttestations without args', async () => {
    await consensusService.getPoolPayloadAttestations();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/pool/payload_attestations',
      undefined,
    );
  });

  test('submitPayloadAttestationMessages', async () => {
    await expect(
      consensusService.submitPayloadAttestationMessages(),
    ).rejects.toThrow();
  });

  test('getSignedExecutionPayloadEnvelope', async () => {
    await consensusService.getSignedExecutionPayloadEnvelope({
      blockId: 'head',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/execution_payload_envelope/head',
      undefined,
    );
  });

  test('publishExecutionPayloadBid', async () => {
    await expect(
      consensusService.publishExecutionPayloadBid(),
    ).rejects.toThrow();
  });

  test('getProposerLookahead', async () => {
    await consensusService.getProposerLookahead({ stateId: 'head' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/states/head/proposer_lookahead',
      undefined,
    );
  });

  test('getPoolProposerSlashings', async () => {
    await consensusService.getPoolProposerSlashings();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/pool/proposer_slashings',
      undefined,
    );
  });

  test('submitPoolProposerSlashings', async () => {
    await expect(
      consensusService.submitPoolProposerSlashings(),
    ).rejects.toThrow();
  });

  test('submitPoolSyncCommitteeSignatures', async () => {
    await expect(
      consensusService.submitPoolSyncCommitteeSignatures(),
    ).rejects.toThrow();
  });

  test('getPoolVoluntaryExits', async () => {
    await consensusService.getPoolVoluntaryExits();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/pool/voluntary_exits',
      undefined,
    );
  });

  test('submitPoolVoluntaryExit', async () => {
    await expect(consensusService.submitPoolVoluntaryExit()).rejects.toThrow();
  });
});
