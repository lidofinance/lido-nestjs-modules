export const range = (start: number, end: number) => {
  function* iterator(n: number) {
    for (let i = start; i < n; i++) yield i;
  }

  return [...iterator(end)];
};

export const timeMeasurer = () => {
  const start = process.hrtime.bigint();
  return () => {
    const ns = process.hrtime.bigint() - start;
    return {
      ns,
      ms: Number(ns) / 1000000,
      sec: Number(ns) / 1000000000,
    };
  };
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
  Math.ceil(min);
