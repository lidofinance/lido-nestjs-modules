import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';

describe('Validator endpoints', () => {
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

  test('getAttesterDuties', async () => {
    await expect(consensusService.getAttesterDuties()).rejects.toThrow();
  });

  test('getProposerDuties', async () => {
    await consensusService.getProposerDuties({ epoch: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/validator/duties/proposer/1',
      undefined,
    );
  });

  test('getProposerDutiesV2', async () => {
    await consensusService.getProposerDutiesV2({ epoch: '7' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/validator/duties/proposer/7',
      undefined,
    );
  });

  test('getPtcDuties', async () => {
    await expect(consensusService.getPtcDuties()).rejects.toThrow();
  });

  test('getSyncCommitteeDuties', async () => {
    await expect(consensusService.getSyncCommitteeDuties()).rejects.toThrow();
  });

  test('getAggregatedAttestationV2', async () => {
    await consensusService.getAggregatedAttestationV2({
      slot: '1',
      attestationDataRoot: '2',
      committeeIndex: '3',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/validator/aggregate_attestation?slot=1&attestation_data_root=2&committee_index=3',
      undefined,
    );
  });

  test('produceBlockV3', async () => {
    await consensusService.produceBlockV3({
      slot: '1',
      randaoReveal: '2',
      graffiti: '3',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v3/validator/blocks/1?randao_reveal=2&graffiti=3',
      undefined,
    );
  });

  test('produceAttestationData', async () => {
    await consensusService.produceAttestationData({
      slot: '1',
      committeeIndex: '2',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/validator/attestation_data?slot=1&committee_index=2',
      undefined,
    );
  });

  test('producePayloadAttestationData', async () => {
    const mockFetchText = jest
      .spyOn(fetchService, 'fetchText')
      .mockImplementation(async () => '{"version":"gloas","data":{}}');

    const result = await consensusService.producePayloadAttestationData({
      slot: '12',
    });

    expect(result).toEqual({ version: 'gloas', data: {} });
    expect(mockFetchText).toBeCalledTimes(1);
    expect(mockFetchText).toBeCalledWith(
      '/eth/v1/validator/payload_attestation_data?slot=12',
      undefined,
    );
  });

  test('producePayloadAttestationData with no content', async () => {
    jest.spyOn(fetchService, 'fetchText').mockImplementation(async () => '');

    const result = await consensusService.producePayloadAttestationData({
      slot: '12',
    });

    expect(result).toBeNull();
  });

  test('produceBlockV4', async () => {
    await expect(consensusService.produceBlockV4()).rejects.toThrow();
  });

  test('getExecutionPayloadEnvelope', async () => {
    await expect(
      consensusService.getExecutionPayloadEnvelope(),
    ).rejects.toThrow();
  });

  test('submitProposerPreferences', async () => {
    await expect(
      consensusService.submitProposerPreferences(),
    ).rejects.toThrow();
  });

  test('submitBuilderPreferences', async () => {
    await expect(consensusService.submitBuilderPreferences()).rejects.toThrow();
  });

  test('publishAggregateAndProofsV2', async () => {
    await expect(
      consensusService.publishAggregateAndProofsV2(),
    ).rejects.toThrow();
  });

  test('prepareBeaconCommitteeSubnet', async () => {
    await expect(
      consensusService.prepareBeaconCommitteeSubnet(),
    ).rejects.toThrow();
  });

  test('prepareSyncCommitteeSubnets', async () => {
    await expect(
      consensusService.prepareSyncCommitteeSubnets(),
    ).rejects.toThrow();
  });

  test('produceSyncCommitteeContribution', async () => {
    await consensusService.produceSyncCommitteeContribution({
      slot: '1',
      subcommitteeIndex: '2',
      beaconBlockRoot: '3',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/validator/sync_committee_contribution?slot=1&subcommittee_index=2&beacon_block_root=3',
      undefined,
    );
  });

  test('publishContributionAndProofs', async () => {
    await expect(
      consensusService.publishContributionAndProofs(),
    ).rejects.toThrow();
  });

  test('prepareBeaconProposer', async () => {
    await expect(consensusService.prepareBeaconProposer()).rejects.toThrow();
  });

  test('registerValidator', async () => {
    await expect(consensusService.registerValidator()).rejects.toThrow();
  });
});
