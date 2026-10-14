import { HttpException } from '@nestjs/common';
import { getHttpErrorStatus } from '../src/utils/http-error';

describe('getHttpErrorStatus', () => {
  test('reads the status of an error the fetch layer throws', () => {
    expect(getHttpErrorStatus(new HttpException('Not found', 404))).toBe(404);
    expect(getHttpErrorStatus(new HttpException('Server error', 500))).toBe(
      500,
    );
  });

  test('gives nothing for an error that carries no status', () => {
    expect(getHttpErrorStatus(new Error('socket hang up'))).toBeUndefined();
    expect(getHttpErrorStatus('plain string')).toBeUndefined();
    expect(getHttpErrorStatus(null)).toBeUndefined();
    expect(getHttpErrorStatus(undefined)).toBeUndefined();
  });

  test('gives nothing when the status is not a number', () => {
    expect(
      getHttpErrorStatus({ getStatus: () => 'not a number' }),
    ).toBeUndefined();
  });
});
