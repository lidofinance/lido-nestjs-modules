import { Test } from '@nestjs/testing';
import { NopMerkleTreeService, KeySignBuffer } from '../../src';
import crypto from 'crypto';

describe('NopMerkle Tree service', () => {
  let nopMerkleTreeService: NopMerkleTreeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [NopMerkleTreeService],
    }).compile();
    nopMerkleTreeService = moduleRef.get(NopMerkleTreeService);
  });

  test('Methods are defined', () => {
    expect(nopMerkleTreeService.createTree).toBeDefined();
    expect(nopMerkleTreeService.prepareProofs).toBeDefined();
  });

  test('creation tree by proofs', () => {
    const leafAmount = 8;
    // create and prepare data
    const keys: KeySignBuffer[] = Array.from({ length: leafAmount }, () => [
      crypto.randomBytes(48),
      crypto.randomBytes(96),
    ]);

    // create Tree
    const tree = nopMerkleTreeService.createTree(keys);

    // prepare proofs for key sign pair and check root created from proofs
    for (let i = 0; i < keys.length; i++) {
      const { hash, proofs } = nopMerkleTreeService.prepareProofs(tree, i);

      const calculatedRoot = nopMerkleTreeService.createTreeFromProofs(
        hash,
        i,
        tree.leafAmount,
        proofs,
      );

      expect(calculatedRoot).toEqual(tree.root);
    }
  });
});
