import { normalizeProviderLabel } from '../src/utils/provider-label';

describe('normalizeProviderLabel', () => {
  test('should normalize registrable domains', () => {
    expect(normalizeProviderLabel('https://lb.drpc.org')).toBe('drpc.org');
    expect(normalizeProviderLabel('https://eth-holesky.g.alchemy.com')).toBe(
      'alchemy.com',
    );
    expect(normalizeProviderLabel('https://lb.drpc.org:8443')).toBe('drpc.org');
  });

  test('should preserve IP and port', () => {
    expect(normalizeProviderLabel('http://192.168.0.1:8545')).toBe(
      '192.168.0.1:8545',
    );
  });

  test('should preserve IP without port', () => {
    expect(normalizeProviderLabel('http://192.168.0.1')).toBe('192.168.0.1');
  });

  test('should preserve IPv6 fallback labels', () => {
    expect(normalizeProviderLabel(undefined, '[2001:db8::1]')).toBe(
      '2001:db8::1',
    );
  });

  test('should keep second-level domains as-is', () => {
    expect(normalizeProviderLabel('example.com')).toBe('example.com');
  });

  test('should return empty string for empty fallback domain', () => {
    expect(normalizeProviderLabel(undefined, '   ')).toBe('');
  });

  test('should fallback when url parsing fails', () => {
    expect(normalizeProviderLabel('   ', 'subdomain.example.com')).toBe(
      'example.com',
    );
  });

  test('should fallback to normalized domain when url is unavailable', () => {
    expect(normalizeProviderLabel(undefined, 'subdomain.example.com')).toBe(
      'example.com',
    );
  });
});
