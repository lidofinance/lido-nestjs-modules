import { BLSPubkeyHex } from '../../src';

describe('BLSPubkeyHex type', () => {
  test('should work ', async () => {
    const type = BLSPubkeyHex;

    const pubkey =
      '0x8bd69e4f185b8127c39314f990a0d339878ad796dca264f2ff6cfe4d332a4ded3fafda493b2588d1868c75e25bbccdfa';

    const pubkeyUpperCase =
      '0x8BD69E4F185B8127C39314F990A0D339878AD796DCA264F2FF6CFE4D332A4DED3FAFDA493B2588D1868C75E25BBCCDFA';

    expect(type.parse(pubkey)).toBe(pubkey);
    expect(type.parse(pubkeyUpperCase)).toBe(pubkey);
  });

  test('should throw on bad data ', async () => {
    const type = BLSPubkeyHex;

    const pubkeyWithout0x =
      '8bd69e4f185b8127c39314f990a0d339878ad796dca264f2ff6cfe4d332a4ded3fafda493b2588d1868c75e25bbccdfa';

    const pubkeyBadHex =
      '0x8bG69e4f185b8127c39314f990a0d339878ad796dca264f2ff6cfe4d332a4ded3fafda493b2588d1868c75e25bbccdfa';

    expect(type.safeParse(pubkeyWithout0x).success).toBe(false);
    expect(type.safeParse(pubkeyBadHex).success).toBe(false);
    expect(type.safeParse(12345.5).success).toBe(false);
    expect(type.safeParse(NaN).success).toBe(false);
    expect(type.safeParse(+Infinity).success).toBe(false);
    expect(type.safeParse(-Infinity).success).toBe(false);

    expect(type.safeParse('-1').success).toBe(false);
    expect(type.safeParse('12345.5').success).toBe(false);

    expect(type.safeParse({}).success).toBe(false);
    expect(type.safeParse({}).success).toBe(false);
    expect(type.safeParse(true).success).toBe(false);
    expect(type.safeParse(false).success).toBe(false);
    expect(type.safeParse('').success).toBe(false);
    expect(type.safeParse('0b0').success).toBe(false);
    expect(type.safeParse('0x0').success).toBe(false);
  });
});
