import {
  VersionedSignedBeaconBlock,
  hasExecutionPayload,
  hasExecutionPayloadBid,
  isForkAtLeast,
} from '../src';

describe('Fork helpers', () => {
  test('isForkAtLeast', () => {
    expect(isForkAtLeast('gloas', 'gloas')).toBe(true);
    expect(isForkAtLeast('gloas', 'fulu')).toBe(true);
    expect(isForkAtLeast('fulu', 'gloas')).toBe(false);
  });
});

describe('Block guards', () => {
  const block = (version: string) =>
    ({ version } as unknown as VersionedSignedBeaconBlock);

  test('hasExecutionPayload', () => {
    expect(hasExecutionPayload(block('phase0'))).toBe(false);
    expect(hasExecutionPayload(block('altair'))).toBe(false);
    expect(hasExecutionPayload(block('bellatrix'))).toBe(true);
    expect(hasExecutionPayload(block('fulu'))).toBe(true);
    expect(hasExecutionPayload(block('gloas'))).toBe(false);
    expect(hasExecutionPayload(block('heze'))).toBe(false);
  });

  test('hasExecutionPayloadBid', () => {
    expect(hasExecutionPayloadBid(block('fulu'))).toBe(false);
    expect(hasExecutionPayloadBid(block('gloas'))).toBe(true);
    expect(hasExecutionPayloadBid(block('heze'))).toBe(false);
  });
});
