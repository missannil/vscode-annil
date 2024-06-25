export function assertNonNullable<T>(value: T): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`${value} should not be null or undefined`);
  }

  return value;
}
