jest.mock('node-fetch');

import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '../src';
import fetch from 'node-fetch';

const { Response } = jest.requireActual('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

@Injectable()
class TestService {
  public foo = jest.fn();
}
@Module({
  providers: [TestService],
  exports: [TestService],
})
class TestModule {}

describe('Module initializing', () => {
  describe('For root', () => {
    let fetchService: FetchService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [FetchModule.forRoot()],
      }).compile();

      fetchService = moduleRef.get(FetchService);
    });

    test('Methods should be defined', async () => {
      expect(fetchService.fetchJson).toBeDefined();
      expect(fetchService.fetchText).toBeDefined();
    });
  });

  describe('For feature', () => {
    let fetchService: FetchService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [FetchModule.forFeature()],
      }).compile();

      fetchService = moduleRef.get(FetchService);
    });

    test('Methods should be defined', async () => {
      expect(fetchService.fetchJson).toBeDefined();
      expect(fetchService.fetchText).toBeDefined();
    });
  });

  describe('For root async', () => {
    test('Test service', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          FetchModule.forRootAsync({
            imports: [TestModule],
            async useFactory(testService: TestService) {
              return {
                middlewares: [
                  (next) => {
                    testService.foo();
                    return next();
                  },
                ],
              };
            },
            inject: [TestService],
          }),
        ],
      }).compile();

      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}))),
      );

      const fetchService = await moduleRef.resolve(FetchService);
      const testService = await moduleRef.resolve(TestService);

      expect(testService.foo).toBeCalledTimes(0);
      fetchService.fetchJson('/foo');
      expect(testService.foo).toBeCalledTimes(1);
    });
  });

  describe('For feature async', () => {
    const expected = { foo: 'bar' };

    beforeEach(async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(expected))),
      );
    });

    test('Test service', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          FetchModule.forFeatureAsync({
            async useFactory() {
              return {};
            },
          }),
        ],
      }).compile();

      const fetchService = await moduleRef.resolve(FetchService);
      const result = await fetchService.fetchJson('/foo');

      expect(result).toEqual(expected);
    });

    test('Test service', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          FetchModule.forFeatureAsync({
            imports: [TestModule],
            async useFactory(testService: TestService) {
              return {
                middlewares: [
                  (next) => {
                    testService.foo();
                    return next();
                  },
                ],
              };
            },
            inject: [TestService],
          }),
        ],
      }).compile();

      const fetchService = await moduleRef.resolve(FetchService);
      const testService = await moduleRef.resolve(TestService);

      expect(testService.foo).toBeCalledTimes(0);
      await fetchService.fetchJson('/foo');
      expect(testService.foo).toBeCalledTimes(1);
    });
  });
});
