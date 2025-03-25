import { toNumber, toBoolean, toArrayOfUrls } from '../src';

describe('toNumber', () => {
  test('should return a default value if value is null or undefined', () => {
    expect(toNumber({ defaultValue: 3000 })({ value: undefined })).toEqual(
      3000,
    );
    expect(toNumber({ defaultValue: 3000 })({ value: null })).toEqual(3000);
  });

  test('should return a default value if value is an empty string', () => {
    expect(toNumber({ defaultValue: 3000 })({ value: '' })).toEqual(3000);
  });

  test('should convert a passed value to the number', () => {
    expect(toNumber({ defaultValue: 3000 })({ value: '5000' })).toEqual(5000);
  });
});

describe('toBoolean', () => {
  test('should return a default value if value is null or undefined', () => {
    expect(toBoolean({ defaultValue: true })({ value: undefined })).toEqual(
      true,
    );
    expect(toBoolean({ defaultValue: true })({ value: null })).toEqual(true);
  });

  test('should return a default value if value is an empty string', () => {
    expect(toBoolean({ defaultValue: true })({ value: '' })).toEqual(true);
  });

  test('should return the passed boolean value if it has a boolean type', () => {
    expect(toBoolean({ defaultValue: true })({ value: false })).toEqual(false);
    expect(toBoolean({ defaultValue: false })({ value: true })).toEqual(true);
  });

  test('should return true if the passed value is the word "true" in any case', () => {
    expect(toBoolean({ defaultValue: false })({ value: 'true' })).toEqual(true);
    expect(toBoolean({ defaultValue: false })({ value: 'True' })).toEqual(true);
    expect(toBoolean({ defaultValue: false })({ value: 'TRUE' })).toEqual(true);
  });

  test('should return true if the passed value is the word "yes" in any case', () => {
    expect(toBoolean({ defaultValue: false })({ value: 'yes' })).toEqual(true);
    expect(toBoolean({ defaultValue: false })({ value: 'Yes' })).toEqual(true);
    expect(toBoolean({ defaultValue: false })({ value: 'YES' })).toEqual(true);
  });

  test('should return true if the passed value is 1', () => {
    expect(toBoolean({ defaultValue: false })({ value: '1' })).toEqual(true);
    expect(toBoolean({ defaultValue: false })({ value: 1 })).toEqual(true);
  });

  test('should return false if the passed value is the word "false" in any case', () => {
    expect(toBoolean({ defaultValue: true })({ value: 'false' })).toEqual(
      false,
    );
    expect(toBoolean({ defaultValue: true })({ value: 'False' })).toEqual(
      false,
    );
    expect(toBoolean({ defaultValue: true })({ value: 'FALSE' })).toEqual(
      false,
    );
  });

  test('should return false if the passed value is the word "no" in any case', () => {
    expect(toBoolean({ defaultValue: true })({ value: 'no' })).toEqual(false);
    expect(toBoolean({ defaultValue: true })({ value: 'No' })).toEqual(false);
    expect(toBoolean({ defaultValue: true })({ value: 'NO' })).toEqual(false);
  });

  test('should return false if the passed value is 0', () => {
    expect(toBoolean({ defaultValue: true })({ value: '0' })).toEqual(false);
    expect(toBoolean({ defaultValue: true })({ value: 0 })).toEqual(false);
  });

  test('should return the passed value if it is not equal to any of the above-listed strings', () => {
    expect(toBoolean({ defaultValue: true })({ value: 'abc' })).toEqual('abc');
    expect(toBoolean({ defaultValue: true })({ value: '123' })).toEqual('123');
    expect(toBoolean({ defaultValue: true })({ value: 123 })).toEqual(123);
    expect(toBoolean({ defaultValue: true })({ value: 2 })).toEqual(2);
    expect(toBoolean({ defaultValue: true })({ value: -1 })).toEqual(-1);

    expect(toBoolean({ defaultValue: false })({ value: 'abc' })).toEqual('abc');
    expect(toBoolean({ defaultValue: false })({ value: '123' })).toEqual('123');
    expect(toBoolean({ defaultValue: false })({ value: 123 })).toEqual(123);
    expect(toBoolean({ defaultValue: false })({ value: 2 })).toEqual(2);
    expect(toBoolean({ defaultValue: false })({ value: -1 })).toEqual(-1);
  });
});

describe('toArrayOfUrls', () => {
  test('should return an empty array if passed URL is null or undefined', () => {
    expect(toArrayOfUrls(undefined)).toEqual([]);
    expect(toArrayOfUrls(null)).toEqual([]);
  });

  test('should return an empty array if passed URL is an empty string', () => {
    expect(toArrayOfUrls('')).toEqual([]);
  });

  test('should split a string of comma-separated URLs into array of URLs', () => {
    expect(toArrayOfUrls('https://google.com,https://microsoft.com')).toEqual([
      'https://google.com',
      'https://microsoft.com',
    ]);
  });

  test('should remove leading and trailing whitespaces from the URLs in the resulting list', () => {
    expect(
      toArrayOfUrls('  https://google.com   , https://microsoft.com  '),
    ).toEqual(['https://google.com', 'https://microsoft.com']);
  });

  test('should remove trailing slash from the URLs in the resulting list', () => {
    expect(
      toArrayOfUrls('  https://google.com/   , https://microsoft.com/  '),
    ).toEqual(['https://google.com', 'https://microsoft.com']);
  });
});
