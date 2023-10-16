/* eslint-disable @typescript-eslint/no-var-requires  */
import { Options } from '@mikro-orm/core';
import * as dotenv from 'dotenv';
import { ConsensusMetaEntity, ConsensusValidatorEntity } from './src/storage';
dotenv.config();

const config: Options = {
  type: 'postgresql',
  dbName: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT ?? '', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [ConsensusValidatorEntity, ConsensusMetaEntity],
  // migrations: getMigrationOptions(path.join(__dirname, 'migrations'), [
  //   '@lido-nestjs/validators-registry',
  // ]),
};

export default config;
