import { Module } from '@nestjs/common';
import { NopMerkleTreeService } from './nop-merkle-tree.service';

@Module({
  imports: [],
  providers: [NopMerkleTreeService],
  exports: [NopMerkleTreeService],
})
export class NopMerkleTreeModule {}
