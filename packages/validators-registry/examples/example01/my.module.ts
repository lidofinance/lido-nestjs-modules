import { Module } from '@nestjs/common';
import {
  ValidatorsRegistryModule,
  StorageModule,
} from '@lido-nestjs/validators-registry';
import { ConsensusModule } from '@lido-nestjs/consensus';
import { FetchModule } from '@lido-nestjs/fetch';
import { MyService } from './my.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: ':memory:',
      driver: SqliteDriver,
      entities: [...StorageModule.entities], // optional
      migrations: {
        /* migrations data */
      },
    }),
    ValidatorsRegistryModule.forFeature({
      imports: [
        ConsensusModule.forFeature({
          imports: [
            FetchModule.forFeature({
              baseUrls: ['http://consensus-node:4001'],
            }),
          ],
        }),
      ],
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}
