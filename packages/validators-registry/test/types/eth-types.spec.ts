import {
  BlockNumber,
  BlockTimestamp,
  Epoch,
  Slot,
  ValidatorIndex,
} from '../../src';

describe('Ethereum Numeric types', () => {
  const typeSchemas = [
    { name: 'Epoch', type: Epoch },
    { name: 'Slot', type: Slot },
    { name: 'BlockNumber', type: BlockNumber },
    { name: 'ValidatorIndex', type: ValidatorIndex },
    { name: 'BlockTimestamp', type: BlockTimestamp },
  ];

  test.each(typeSchemas)('should work $name', async (typeSchema) => {
    const type = typeSchema.type;

    expect(type.parse(0)).toBe(0);
    expect(type.parse(12345)).toBe(12345);

    expect(type.parse('0')).toBe(0);
    expect(type.parse('001')).toBe(1);
    expect(type.parse('12345')).toBe(12345);

    expect(type.parse(9007199254740991)).toBe(Number.MAX_SAFE_INTEGER);
    expect(type.parse('9007199254740991')).toBe(Number.MAX_SAFE_INTEGER);
  });

  test.each(typeSchemas)('should work $name', async (typeSchema) => {
    const type = typeSchema.type;

    expect(type.safeParse(-1).success).toBe(false);
    expect(type.safeParse(12345.5).success).toBe(false);
    expect(type.safeParse(NaN).success).toBe(false);
    expect(type.safeParse(+Infinity).success).toBe(false);
    expect(type.safeParse(-Infinity).success).toBe(false);

    expect(type.safeParse('-1').success).toBe(false);
    expect(type.safeParse('12345.5').success).toBe(false);
    expect(type.safeParse('non-integer').success).toBe(false);

    expect(type.safeParse({}).success).toBe(false);
    expect(type.safeParse({}).success).toBe(false);
    expect(type.safeParse(true).success).toBe(false);
    expect(type.safeParse(false).success).toBe(false);
    expect(type.safeParse('').success).toBe(false);
    expect(type.safeParse('0b0').success).toBe(false);
    expect(type.safeParse('0x0').success).toBe(false);
  });
});
