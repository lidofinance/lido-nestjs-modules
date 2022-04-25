import { TypedEvent } from '@lido-nestjs/contracts';
import { BigNumber } from '@ethersproject/bignumber';

export type UnbufferedEvent = TypedEvent<[BigNumber], { amount: BigNumber }>;
