import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';

describe('Beacon endpoints', () => {
  let consensusService: ConsensusService;
  let fetchService: FetchService;
  let mockFetch: jest.SpyInstance<
    ReturnType<FetchService['fetchJson']>,
    Parameters<FetchService['fetchJson']>
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

  test('publishBlock', async () => {
    await expect(consensusService.publishBlock()).rejects.toThrow();
  });

  test('getBlock', async () => {
    await consensusService.getBlock({ blockId: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/beacon/blocks/1', undefined);
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

  test('getBlockAttestations', async () => {
    await consensusService.getBlockAttestations({ blockId: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/blocks/1/attestations',
      undefined,
    );
  });

  test('getPoolAttestations', async () => {
    await consensusService.getPoolAttestations({
      slot: '1',
      committeeIndex: '2',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/pool/attestations?slot=1&committee_index=2',
      undefined,
    );
  });

  test('getPoolAttestations', async () => {
    await consensusService.getPoolAttestations();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/pool/attestations',
      undefined,
    );
  });

  test('submitPoolAttestations', async () => {
    await expect(consensusService.submitPoolAttestations()).rejects.toThrow();
  });

  test('getPoolAttesterSlashings', async () => {
    await consensusService.getPoolAttesterSlashings();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/beacon/pool/attester_slashings',
      undefined,
    );
  });

  test('submitPoolAttesterSlashings', async () => {
    await expect(
      consensusService.submitPoolAttesterSlashings(),
    ).rejects.toThrow();
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
