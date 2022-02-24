import { Test } from '@nestjs/testing';
import {
  FallbackProviderModule,
  ExtendedJsonRpcBatchProvider,
  BatchProviderModule,
  SimpleFallbackJsonRpcBatchProvider,
} from '../src';
import { nullTransport, LoggerModule } from '@lido-nestjs/logger';

describe('Module sync initializing', () => {
  describe('BatchProviderModule', () => {
    describe('forRoot', () => {
      let extendedJsonRpcBatchProvider: ExtendedJsonRpcBatchProvider;

      beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
          imports: [
            BatchProviderModule.forRoot({
              imports: [
                LoggerModule.forRoot({ transports: [nullTransport()] }),
              ],
              url: 'http://localhost',
              network: 1,
            }),
          ],
        }).compile();

        extendedJsonRpcBatchProvider = moduleRef.get(
          ExtendedJsonRpcBatchProvider,
        );
      });

      test('Methods should be defined', async () => {
        expect(extendedJsonRpcBatchProvider.send).toBeDefined();
        expect(extendedJsonRpcBatchProvider.detectNetwork).toBeDefined();
      });
    });

    describe('forFeature', () => {
      let extendedJsonRpcBatchProvider: ExtendedJsonRpcBatchProvider;

      beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
          imports: [
            BatchProviderModule.forFeature({
              imports: [
                LoggerModule.forRoot({ transports: [nullTransport()] }),
              ],
              url: 'http://localhost',
              network: 1,
            }),
          ],
        }).compile();

        extendedJsonRpcBatchProvider = moduleRef.get(
          ExtendedJsonRpcBatchProvider,
        );
      });

      test('Methods should be defined', async () => {
        expect(extendedJsonRpcBatchProvider.send).toBeDefined();
        expect(extendedJsonRpcBatchProvider.detectNetwork).toBeDefined();
      });
    });
  });

  describe('FallbackProviderModule', () => {
    describe('forRoot', () => {
      let simpleFallbackJsonRpcBatchProvider: SimpleFallbackJsonRpcBatchProvider;

      beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
          imports: [
            FallbackProviderModule.forRoot({
              imports: [
                LoggerModule.forRoot({ transports: [nullTransport()] }),
              ],
              urls: ['http://localhost'],
              network: 1,
            }),
          ],
        }).compile();

        simpleFallbackJsonRpcBatchProvider = moduleRef.get(
          SimpleFallbackJsonRpcBatchProvider,
        );
      });

      test('Methods should be defined', async () => {
        expect(simpleFallbackJsonRpcBatchProvider.getBlock).toBeDefined();
        expect(simpleFallbackJsonRpcBatchProvider.detectNetwork).toBeDefined();
      });
    });

    describe('forFeature', () => {
      let simpleFallbackJsonRpcBatchProvider: SimpleFallbackJsonRpcBatchProvider;

      beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
          imports: [
            FallbackProviderModule.forFeature({
              imports: [
                LoggerModule.forRoot({ transports: [nullTransport()] }),
              ],
              urls: ['http://localhost'],
              network: 1,
            }),
          ],
        }).compile();

        simpleFallbackJsonRpcBatchProvider = moduleRef.get(
          SimpleFallbackJsonRpcBatchProvider,
        );
      });

      test('Methods should be defined', async () => {
        expect(simpleFallbackJsonRpcBatchProvider.getBlock).toBeDefined();
        expect(simpleFallbackJsonRpcBatchProvider.detectNetwork).toBeDefined();
      });
    });
  });
});
