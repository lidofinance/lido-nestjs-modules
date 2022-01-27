import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';

describe('Config endpoints', () => {
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

  test('getForkSchedule', async () => {
    await consensusService.getForkSchedule();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/config/fork_schedule', undefined);
  });

  test('getSpec', async () => {
    await consensusService.getSpec();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/config/spec', undefined);
  });

  test('getDepositContract', async () => {
    await consensusService.getDepositContract();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/config/deposit_contract',
      undefined,
    );
  });
});
