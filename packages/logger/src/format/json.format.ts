import * as winston from 'winston';
import { cleanSecrets } from './secrets.format';

export const json = (secrets?: string[]): winston.Logform.Format => {
  return winston.format.combine(
    cleanSecrets({ secrets }),
    winston.format.json(),
  );
};
