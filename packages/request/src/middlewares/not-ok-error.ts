import { HttpException } from '@nestjs/common';
import { Middleware } from '../interfaces';
import { extractErrorBody } from '../common';

export const notOkError = (): Middleware => async (config, next) => {
  const response = await next(config);
  if (!response?.ok) {
    const errorBody = await extractErrorBody(response);
    throw new HttpException(errorBody, response.status);
  }
  return response;
};
