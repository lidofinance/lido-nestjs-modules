export const toNumber =
  ({ defaultValue }: { defaultValue: number }) =>
  ({ value }: { value: unknown }) => {
    if (value === '' || value == null) {
      return defaultValue;
    }
    return Number(value);
  };

export const toBoolean = ({ defaultValue }: { defaultValue: boolean }) => {
  return function ({ value }: { value: unknown }) {
    if (value == null || value === '') {
      return defaultValue;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    const str = String(value).toLowerCase().trim();

    switch (str) {
      case 'true':
      case 'yes':
      case '1':
        return true;

      case 'false':
      case 'no':
      case '0':
        return false;

      default:
        return value;
    }
  };
};

export const toArrayOfUrls = (url: string | null | undefined): string[] => {
  if (url == null || url === '') {
    return [];
  }

  return url.split(',').map((str) => str.trim().replace(/\/$/, ''));
};
