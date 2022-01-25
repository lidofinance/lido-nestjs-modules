jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { FetchService } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';

describe('Node endpoints', () => {
  let consensusService: ConsensusService;
  let fetchService: FetchService;
  let mockFetch: jest.SpyInstance<
    ReturnType<FetchService['fetchJson']>,
    Parameters<FetchService['fetchJson']>
  >;

  beforeEach(async () => {
    const module = { imports: [ConsensusModule.forFeature()] };
    const moduleRef = await Test.createTestingModule(module).compile();
    consensusService = moduleRef.get(ConsensusService);
    fetchService = moduleRef.get(FetchService);

    mockFetch = jest
      .spyOn(fetchService, 'fetchJson')
      .mockImplementation(async () => null);
  });

  test('getNetworkIdentity', async () => {
    await consensusService.getNetworkIdentity();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/node/identity', undefined);
  });

  test('getPeers', async () => {
    await consensusService.getPeers({
      state: ['connected'],
      direction: ['inbound', 'outbound'],
    });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(
      '/eth/v1/node/peers?state=connected&direction=inbound%2Coutbound',
      undefined,
    );
  });

  test('getPeer', async () => {
    await consensusService.getPeer({ peerId: '1' });

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/node/peers/1', undefined);
  });

  test('getPeerCount', async () => {
    await consensusService.getPeerCount();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/node/peer_count', undefined);
  });

  test('getNodeVersion', async () => {
    await consensusService.getNodeVersion();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/node/version', undefined);
  });

  test('getSyncingStatus', async () => {
    await consensusService.getSyncingStatus();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/node/syncing', undefined);
  });

  test('getHealth', async () => {
    await consensusService.getHealth();

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith('/eth/v1/node/health', undefined);
  });
});
