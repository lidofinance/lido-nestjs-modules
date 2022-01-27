import { FetchModule } from '../src';

describe('Extra module fields', () => {
  test('Imports', async () => {
    expect(FetchModule.defaultImports).toBeDefined();
    expect(FetchModule.defaultImports).toBeInstanceOf(Array);
  });

  test('Providers', async () => {
    expect(FetchModule.defaultProviders).toBeDefined();
    expect(FetchModule.defaultProviders).toBeInstanceOf(Array);
  });
});
