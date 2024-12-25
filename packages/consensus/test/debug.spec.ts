import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';

describe('Debug endpoints', () => {
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

  test('getStateV2', async () => {
    await consensusService.getStateV2({ stateId: 'head' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v2/debug/beacon/states/head',
      undefined,
    );
  });

  test('getDebugChainHeadsV2', async () => {
    await consensusService.getDebugChainHeadsV2();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v2/debug/beacon/heads', undefined);
  });
});
