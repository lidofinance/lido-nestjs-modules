export const range = (start: number, end: number) => {
  function* iterator(n: number) {
    for (let i = start; i < n; i++) yield i;
  }

  return [...iterator(end)];
};
