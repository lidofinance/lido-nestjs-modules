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

  test('getSyncCommitteeDuties', async () => {
    await expect(consensusService.getSyncCommitteeDuties()).rejects.toThrow();
  });

  test('produceBlock', async () => {
    await consensusService.produceBlock({
      slot: '1',
      randaoReveal: '2',
      graffiti: '3',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/validator/blocks/1?randao_reveal=2&graffiti=3',
      undefined,
    );
  });

  test('produceBlockV2', async () => {
    await consensusService.produceBlockV2({
      slot: '1',
      randaoReveal: '2',
      graffiti: '3',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/validator/blocks/1?randao_reveal=2&graffiti=3',
      undefined,
    );
  });

  test('produceBlindedBlock', async () => {
    await consensusService.produceBlindedBlock({
      slot: '1',
      randaoReveal: '2',
      graffiti: '3',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/validator/blinded_blocks/1?randao_reveal=2&graffiti=3',
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

  test('getAggregatedAttestation', async () => {
    await consensusService.getAggregatedAttestation({
      slot: '1',
      attestationDataRoot: '2',
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/validator/aggregate_attestation?slot=1&attestation_data_root=2',
      undefined,
    );
  });

  test('publishAggregateAndProofs', async () => {
    await expect(
      consensusService.publishAggregateAndProofs(),
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
