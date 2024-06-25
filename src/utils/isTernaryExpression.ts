export function isTernaryExpression(expression: string): boolean {
  const ternaryPattern = /[^?]+\?[^:]+:[^:]+/;

  return ternaryPattern.test(expression);
}
