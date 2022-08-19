import { Injectable } from '@nestjs/common';
import { utils } from 'ethers';
import { KeySignBuffer, Tree } from './interfaces';

@Injectable()
export class NopMerkleTreeService {
  createTree(data: KeySignBuffer[]) {
    // Create Keccak256 hashes from data. hashes contains leaves
    const hashes = this.hashKeySigns(data);
    const treeHashes: string[] = [...hashes];
    // n - number of hashes on current level. Consider an even number of leaves
    let n = hashes.length;

    // offset
    let offset = 0;
    while (n > 0) {
      // put hash of pairs in array
      for (let i = 0; i < n - 1; i += 2) {
        treeHashes.push(
          this.hashPair(treeHashes[offset + i], treeHashes[offset + i + 1]),
        );
      }
      // number of hashes that were just created
      offset += n;
      // Number of hashed pairs on next level of tree. In case of even number of leaves the same as devide on 2
      n >>= 1;
    }

    return {
      hashes: treeHashes,
      root: treeHashes[treeHashes.length - 1],
      leafAmount: hashes.length,
      data,
    };
  }

  // index - index of key amoung leafs
  prepareProofs(tree: Tree, index: number) {
    const proofs: string[] = [];

    let offset = 0;
    let len = tree.leafAmount;
    let layerKnownHashIndex = index;

    while (len > 1) {
      const knownHashIndex = offset + layerKnownHashIndex;
      // Determine hash index for creating next level pair of hashes
      // For example we have 8 leaves, on 1 iteration knownHashIndex = h1, so we need h0. using h0 h1 we can create h01.
      const leftOfRight = knownHashIndex & 0x1;
      const hashIndex = knownHashIndex + (leftOfRight ? -1 : 1);
      // put h0 in array of proofs
      proofs.push(tree.hashes[hashIndex]);

      // go to next level of tree
      offset += len;
      // calculate number of hashes on next level
      len >>= 1;
      // calculate known next level hash. In example above it is h01
      layerKnownHashIndex >>= 1;
    }
    const hash = tree.hashes[index];

    return { hash, proofs };
  }

  createTreeFromProofs(
    hash: string,
    hashIndex: number,
    leafAmount: number,
    proofs: string[],
  ): string {
    let calcRoot = hash;
    let index = hashIndex;
    let offset = 0;
    let len = leafAmount;

    for (let i = 0; i < proofs.length; i += 1) {
      calcRoot =
        index % 2
          ? this.hashPair(proofs[i], calcRoot)
          : this.hashPair(calcRoot, proofs[i]);

      offset += len;
      index = offset + (index >> 1);
      len >>= 1;
    }
    return calcRoot;
  }

  private hashPair(a: string, b: string) {
    return utils.solidityKeccak256(['bytes32', 'bytes32'], [a, b]);
  }

  private hashKeySigns(keySigns: KeySignBuffer[]): string[] {
    const data: string[] = [];
    for (let i = 0; i < keySigns.length; i++) {
      data.push(this.hashKeySign(keySigns[i]));
    }
    return data;
  }

  private hashKeySign(keySign: KeySignBuffer): string {
    const keySignBytes: Buffer = Buffer.from([]);
    const data = Buffer.concat([keySignBytes, keySign[0], keySign[1]]);
    return utils.solidityKeccak256(['bytes'], [data]);
  }
}
