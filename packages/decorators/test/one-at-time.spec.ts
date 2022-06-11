import { Logger } from '@nestjs/common';
import { OneAtTime } from '../src';

describe('oneAtTime', () => {
  class Test {
    logger? = new Logger();

    @OneAtTime()
    async testMethod(callback: () => void) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      callback();

      return 1;
    }
  }

  it('should call one time', async () => {
    const testInstance = new Test();
    const mockCall = jest.fn();

    await Promise.all([
      testInstance.testMethod(mockCall),
      testInstance.testMethod(mockCall),
    ]);

    expect(mockCall).toBeCalledTimes(1);
  });

  it('should log error', async () => {
    const testInstance = new Test();
    const mockCall = jest
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .spyOn(testInstance.logger!, 'error')
      .mockImplementation(() => undefined);

    const error = new Error('test');

    await testInstance.testMethod(() => {
      throw error;
    });

    expect(mockCall).toBeCalledTimes(1);
    expect(mockCall).toBeCalledWith(error);
  });

  it('should work without logger', async () => {
    const testInstance = new Test();
    delete testInstance.logger;

    await expect(
      testInstance.testMethod(() => {
        throw new Error('test');
      }),
    ).resolves.toBeUndefined();
  });
});
