/* eslint-disable @typescript-eslint/ban-ts-comment */
import { prom } from '../../src/middlewares/prom';
import { compose } from '../../src/compose';
import { register, Histogram, Registry } from 'prom-client';
import nock from 'nock';
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

const createH = (registryInstance: Registry) =>
  new Histogram({
    name: 'test',
    help: 'help',
    buckets: [1],
    labelNames: ['result', 'status', 'url'],
    registers: [registryInstance],
  });

const checkValues = (
  results: Awaited<ReturnType<Registry['getMetricsAsJSON']>>,
  expected: {
    result: string;
    status: number | string;
    url: string;
  },
) => {
  results.map((result) => {
    // @ts-ignore
    for (const value of result.values) {
      expect(value.labels).toEqual(expect.objectContaining(expected));
    }
  });
};

describe('Prom middleware', () => {
  let registryInstance = new Registry();
  let instance = createH(registryInstance);

  afterEach(() => {
    register.clear();
  });

  beforeEach(() => {
    registryInstance = new Registry();
    instance = createH(registryInstance);
  });
  test('based', async () => {
    nock('http://yolo').get('/foo').reply(200, 'ok');
    await compose([prom(instance)])({ url: 'http://yolo/foo' });

    checkValues(await registryInstance.getMetricsAsJSON(), {
      result: 'success',
      status: 200,
      url: 'http://yolo/foo',
    });
  });
});
