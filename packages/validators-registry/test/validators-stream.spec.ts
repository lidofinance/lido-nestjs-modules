import { processValidatorsStream } from '../src/utils/validators.stream'; // Replace with the actual module path
import { Readable } from 'stream';
import { stateValidatorsA } from './fixtures/consensus';
import { ConsensusDataInvalidError } from '../src';

describe('processValidatorsStream', () => {
  // it('test on pipeline data', async () => {
  //   const mockDataHandler = jest.fn();
  //   // Mock the pipeline object
  //   const pipelineMock = {
  //     on: jest.fn((event, handler) => {
  //       if (event === 'data') {
  //         // Call the mock data handler when 'data' event is triggered
  //         handler(mockDataHandler);
  //       }
  //     }),
  //     // Mock other methods and properties of the pipeline object as needed
  //     // For example, you can add a destroy method if necessary.
  //     destroy: jest.fn(),
  //   };
  //   const mockCallback = jest.fn();

  //   await processValidatorsStream(pipelineMock, mockCallback);

  //   expect(mockDataHandler).toHaveBeenCalled();
  // });

  it('should process validators stream and call the callback with parsed data', async () => {
    const mockCallback = jest.fn();
    const validatorsReadStream = Readable.from(
      JSON.stringify(stateValidatorsA),
    );

    await processValidatorsStream(validatorsReadStream, mockCallback);

    // Assert that the callback was called with the expected data
    expect(mockCallback).toHaveBeenCalledWith([
      {
        pubkey:
          '0xaffc434cf8138634a4cd0ef6cb815febd3db25760b1b6c522f9b4aa78e599b60336d7dd2e953192e45d4ac91f66f0723',
        index: 1,
        status: 'active_ongoing',
      },
      {
        pubkey:
          '0xad9a0951d00c0988d3b8e719b9e65d6bc3501c9c35392fb6f050fcbbcdd316836a887acee989730bdf093629448bb731',
        index: 2,
        status: 'pending_queued',
      },
    ]);
  });

  it('invalid validator data', async () => {
    const mockCallback = jest.fn();
    const validatorsReadStream = Readable.from(
      JSON.stringify({
        execution_optimistic: false,
        data: [
          {
            index: '1',
            balance: '34006594880',
            status: 'soomewrong',
            validator: {
              pubkey:
                '0xaffc434cf8138634a4cd0ef6cb815febd3db25760b1b6c522f9b4aa78e599b60336d7dd2e953192e45d4ac91f66f0723',
              withdrawal_credentials:
                '0x00fc40352b0a186d83267fc1342ec5da49dbb78e1099a4bd8db16d2c0d223594',
              effective_balance: '32000000000',
              slashed: false,
              activation_eligibility_epoch: '0',
              activation_epoch: '0',
              exit_epoch: '18446744073709551615',
              withdrawable_epoch: '18446744073709551615',
            },
          },
        ],
      }),
    );

    try {
      await processValidatorsStream(validatorsReadStream, mockCallback);
    } catch (error: unknown) {
      const typedError = error as ConsensusDataInvalidError;
      expect(typedError).toBeInstanceOf(ConsensusDataInvalidError);
      expect(typedError.message).toEqual('Got invalid validators');
    }

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should process whole list of validators', async () => {
    const mockCallback = jest.fn();
    const validatorsReadStream = Readable.from(
      JSON.stringify(stateValidatorsA),
    );

    await processValidatorsStream(validatorsReadStream, mockCallback, 1);

    // Assert that the callback was called twice, once for each set of data
    expect(mockCallback).toHaveBeenCalledTimes(2);

    // Assert the first call with the first set of data
    expect(mockCallback).toHaveBeenCalledWith([
      {
        pubkey:
          '0xaffc434cf8138634a4cd0ef6cb815febd3db25760b1b6c522f9b4aa78e599b60336d7dd2e953192e45d4ac91f66f0723',
        index: 1,
        status: 'active_ongoing',
      },
    ]);

    // Assert the second call with the second set of data
    expect(mockCallback).toHaveBeenCalledWith([
      {
        pubkey:
          '0xad9a0951d00c0988d3b8e719b9e65d6bc3501c9c35392fb6f050fcbbcdd316836a887acee989730bdf093629448bb731',
        index: 2,
        status: 'pending_queued',
      },
    ]);
  });
});
