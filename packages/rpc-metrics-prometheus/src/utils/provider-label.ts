const IPV4_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;

const normalizeHostLabel = (host: string): string => {
  const normalized = host
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '');

  if (!normalized) {
    return '';
  }

  if (IPV4_REGEX.test(normalized) || normalized.includes(':')) {
    return normalized;
  }

  const parts = normalized.split('.').filter(Boolean);
  if (parts.length <= 2) {
    return normalized;
  }

  return parts.slice(-2).join('.');
};

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value.includes('://') ? value : `http://${value}`);
  } catch {
    return null;
  }
};

export const normalizeProviderLabel = (
  urlLike?: string,
  fallbackDomain = '',
): string => {
  if (urlLike) {
    const parsed = parseUrl(urlLike);
    if (parsed) {
      const normalizedHost = normalizeHostLabel(parsed.hostname);
      if (
        parsed.port &&
        (IPV4_REGEX.test(normalizedHost) || normalizedHost.includes(':'))
      ) {
        return `${normalizedHost}:${parsed.port}`;
      }

      return normalizedHost;
    }
  }

  return normalizeHostLabel(fallbackDomain);
};
