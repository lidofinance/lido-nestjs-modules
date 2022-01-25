jest.mock('node-fetch');

import { Test } from '@nestjs/testing';
import { ConsensusModule, ConsensusService } from '../src';

describe('Validator endpoints', () => {
  let consensusService: ConsensusService;

  beforeEach(async () => {
    const module = { imports: [ConsensusModule.forFeature()] };
    const moduleRef = await Test.createTestingModule(module).compile();
    consensusService = moduleRef.get(ConsensusService);
  });

  test('eventstream', async () => {
    await expect(consensusService.eventstream()).rejects.toThrow();
  });
});
