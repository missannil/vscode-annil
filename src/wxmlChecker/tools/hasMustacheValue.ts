export function hasMustacheValue(value: string): boolean {
  return /{{.*}}/.test(value);
}
