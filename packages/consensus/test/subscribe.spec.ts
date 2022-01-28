/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleMetadata } from '@nestjs/common';
import { FetchModule, FetchService } from '@lido-nestjs/fetch';
import { Test } from '@nestjs/testing';
import {
  ConsensusMethodArgs,
  ConsensusModule,
  ConsensusService,
  CONSENSUS_DEFAULT_POOL_INTERVAL,
  ConsensusSubscribeError,
  ConsensusSubscribeBlock,
} from '../src';

describe('Subscription', () => {
  let consensusService: ConsensusService;
  let fetchService: FetchService;

  const initModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    consensusService = await moduleRef.resolve(ConsensusService);
    fetchService = await moduleRef.resolve(FetchService);
  };

  const getFlatPromise = <T = any>() => {
    const result = {} as {
      promise: Promise<T>;
      resolve: (value?: any) => void;
      reject: (reason?: any) => void;
    };

    result.promise = new Promise((res, rej) => {
      result.resolve = res;
      result.reject = rej;
    });

    return result;
  };

  describe('Polling interval', () => {
    const defaultInterval = CONSENSUS_DEFAULT_POOL_INTERVAL;

    test('Option', async () => {
      const expected = 123;
      await initModules([
        ConsensusModule.forFeature({
          imports: [FetchModule],
          pollingInterval: expected,
        }),
      ]);

      expect(consensusService.pollingInterval).toBe(expected);
    });

    test('Default', async () => {
      await initModules([
        ConsensusModule.forFeature({ imports: [FetchModule] }),
      ]);

      expect(consensusService.pollingInterval).toBe(defaultInterval);
    });

    test('Default', async () => {
      await initModules([
        ConsensusModule.forFeatureAsync({
          imports: [FetchModule],
          async useFactory() {
            return null as any;
          },
        }),
      ]);

      expect(consensusService.pollingInterval).toBe(defaultInterval);
    });
  });

  describe('Slot numbers', () => {
    beforeEach(async () => {
      await initModules([
        ConsensusModule.forFeature({ imports: [FetchModule] }),
      ]);
    });

    test('Default slot number', async () => {
      expect(consensusService.slotNumber).toBe(-1);
    });

    test('Base work', async () => {
      expect(() => {
        consensusService.slotNumber = 1;
        consensusService.slotNumber = 2;
      }).not.toThrowError();
    });

    test('Set wrong value', async () => {
      expect(() => {
        consensusService.slotNumber = undefined as any;
      }).toThrowError();
    });

    test('Set smaller value', async () => {
      expect(() => {
        consensusService.slotNumber = 2;
        consensusService.slotNumber = 1;
      }).toThrowError();
    });
  });

  describe('Subscription', () => {
    const initSubscription = async (
      calls: number,
      args?: ConsensusMethodArgs<'getBlock'>,
    ) => {
      await initModules([
        ConsensusModule.forFeature({
          imports: [FetchModule],
          pollingInterval: 10,
        }),
      ]);

      let callNumber = 1;

      const mockFetch = jest
        .spyOn(fetchService, 'fetchJson')
        .mockImplementation(async () => ({
          data: { message: { slot: callNumber } },
        }));

      const flatPromise = getFlatPromise();
      const unsubscribe = consensusService.subscribe(() => {
        if (callNumber >= calls) flatPromise.resolve();
        callNumber++;
      }, args);
      await flatPromise.promise;
      unsubscribe();

      return mockFetch;
    };

    test('Finalized', async () => {
      const mockFetch = await initSubscription(1, { blockId: 'finalized' });

      expect(mockFetch).toBeCalledWith(
        '/eth/v1/beacon/blocks/finalized',
        expect.any(Object),
      );
    });

    test('Head', async () => {
      const mockFetch = await initSubscription(1, { blockId: 'head' });

      expect(mockFetch).toBeCalledWith(
        '/eth/v1/beacon/blocks/head',
        expect.any(Object),
      );
    });

    test('One block', async () => {
      const calls = 1;
      const mockFetch = await initSubscription(calls);

      expect(mockFetch).toBeCalledTimes(calls);
      expect(consensusService.slotNumber).toBe(calls);
    });

    test('Few blocks', async () => {
      const calls = 3;
      const mockFetch = await initSubscription(calls);

      expect(mockFetch).toBeCalledTimes(calls);
      expect(consensusService.slotNumber).toBe(calls);
    });
  });

  describe('Answers', () => {
    const initSubscription = async (answer: any) => {
      await initModules([
        ConsensusModule.forFeature({ imports: [FetchModule] }),
      ]);

      jest
        .spyOn(fetchService, 'fetchJson')
        .mockImplementation(async () => answer);

      const result = {} as {
        error: ConsensusSubscribeError;
        block: ConsensusSubscribeBlock;
      };

      const flatPromise = getFlatPromise();
      const unsubscribe = consensusService.subscribe((error, block) => {
        Object.assign(result, { error, block });
        flatPromise.resolve();
      });
      await flatPromise.promise;
      unsubscribe();

      return result;
    };

    test('Wrong answer', async () => {
      const answer = { data: null };
      const result = await initSubscription(answer);

      expect(result.error).toBeInstanceOf(Error);
      expect(result.block).toBe(null);
    });

    test('Wrong slot number', async () => {
      const answer = { data: { message: { slot: NaN } } };
      const result = await initSubscription(answer);

      expect(result.error).toBeInstanceOf(Error);
      expect(result.block).toBe(null);
    });

    test('Correct work', async () => {
      const answer = { data: { message: { slot: 5 } } };
      const result = await initSubscription(answer);

      expect(result.error).toBe(null);
      expect(result.block).toBe(answer.data);
    });
  });

  test('Same blocks', async () => {
    const subscribeCalls = 2;

    await initModules([
      ConsensusModule.forFeature({
        imports: [FetchModule],
        pollingInterval: 10,
      }),
    ]);

    let callNumber = 1;

    const mockFetch = jest
      .spyOn(fetchService, 'fetchJson')
      .mockImplementation(async () => null)
      .mockImplementationOnce(async () => ({ data: { message: { slot: 1 } } }))
      .mockImplementationOnce(async () => ({ data: { message: { slot: 1 } } }))
      .mockImplementationOnce(async () => ({ data: { message: { slot: 2 } } }));

    const mockSubscribe = jest.fn();

    const flatPromise = getFlatPromise();
    const unsubscribe = consensusService.subscribe((error, block) => {
      mockSubscribe(error, block);
      if (callNumber >= subscribeCalls) flatPromise.resolve();
      callNumber++;
    });
    await flatPromise.promise;
    unsubscribe();

    const mockCalls = mockSubscribe.mock.calls;

    expect(mockFetch).toBeCalledTimes(3);
    expect(mockSubscribe).toBeCalledTimes(2);
    expect(mockCalls[0]).toEqual([null, { message: { slot: 1 } }]);
    expect(mockCalls[1]).toEqual([null, { message: { slot: 2 } }]);
  });
});
