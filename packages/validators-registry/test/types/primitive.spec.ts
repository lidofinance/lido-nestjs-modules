import { IntegerFromStringNonNegative } from '../../src';

describe('IntegerFromStringNonNegative', () => {
  test('should work', async () => {
    const type = IntegerFromStringNonNegative;
    expect(type.parse('0')).toBe(0);
    expect(type.parse('1')).toBe(1);
    expect(type.parse('001')).toBe(1);
    expect(type.parse('12345')).toBe(12345);
    expect(type.parse('1234500')).toBe(1234500);
    expect(type.parse('9007199254740991')).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('should throw on bad data ', async () => {
    const type = IntegerFromStringNonNegative;

    expect(type.safeParse(-1).success).toBe(false);
    expect(type.safeParse(12345.5).success).toBe(false);
    expect(type.safeParse(NaN).success).toBe(false);
    expect(type.safeParse(+Infinity).success).toBe(false);
    expect(type.safeParse(-Infinity).success).toBe(false);

    expect(type.safeParse('-1').success).toBe(false);
    expect(type.safeParse('12345.5').success).toBe(false);
    expect(type.safeParse('non-integer').success).toBe(false);
    expect(type.safeParse('9007199254740991213123').success).toBe(false);

    expect(type.safeParse({}).success).toBe(false);
    expect(type.safeParse({}).success).toBe(false);
    expect(type.safeParse(true).success).toBe(false);
    expect(type.safeParse(false).success).toBe(false);
    expect(type.safeParse('').success).toBe(false);
    expect(type.safeParse('0b0').success).toBe(false);
    expect(type.safeParse('0x0').success).toBe(false);
  });
});
