import { Response, FetchError } from 'node-fetch';
import { HttpException } from '@nestjs/common';

export const extractErrorBody = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    return response.statusText;
  }
};

export const isNotServerError = (error: Error) =>
  !(error instanceof HttpException) && !(error instanceof FetchError);
