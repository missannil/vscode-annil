export function isStringOrNumber(str: string): boolean {
  return /^(?:\d+|(['"]).*\1)$/.test(str);
}
