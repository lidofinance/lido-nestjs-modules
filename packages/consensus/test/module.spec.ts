import { Test } from '@nestjs/testing';
import { ConsensusModule, ConsensusService } from '../src';

describe('Module initializing', () => {
  describe('For root', () => {
    let consensusService: ConsensusService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ConsensusModule.forRoot()],
      }).compile();

      consensusService = moduleRef.get(ConsensusService);
    });

    test('Methods should be defined', async () => {
      expect(consensusService.getBlock).toBeDefined();
      expect(consensusService.fetch).toBeDefined();
    });
  });

  describe('For feature', () => {
    let consensusService: ConsensusService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ConsensusModule.forFeature()],
      }).compile();

      consensusService = moduleRef.get(ConsensusService);
    });

    test('Methods should be defined', async () => {
      expect(consensusService.getBlock).toBeDefined();
      expect(consensusService.fetch).toBeDefined();
    });
  });
});
