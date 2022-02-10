import { Test } from '@nestjs/testing';
import { FetchModule } from '@lido-nestjs/fetch';
import { ConsensusModule, ConsensusService } from '../src';

describe('Validator endpoints', () => {
  let consensusService: ConsensusService;

  beforeEach(async () => {
    const module = {
      imports: [ConsensusModule.forFeature({ imports: [FetchModule] })],
    };
    const moduleRef = await Test.createTestingModule(module).compile();
    consensusService = moduleRef.get(ConsensusService);
  });

  test('eventstream', async () => {
    await expect(consensusService.eventstream()).rejects.toThrow();
  });
});
