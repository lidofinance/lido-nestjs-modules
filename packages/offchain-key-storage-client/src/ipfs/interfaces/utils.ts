export const hasAttributes = <T extends string>(
  element: unknown,
  attributes: T[],
): element is Record<T, unknown> => {
  if (element == null) {
    return false;
  }
  return attributes.every((attribute) =>
    Object.prototype.hasOwnProperty.call(element, attribute),
  );
};
