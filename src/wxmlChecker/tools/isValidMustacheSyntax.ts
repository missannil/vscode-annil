/**
 * 是否为插值表达式
 * @param str
 * @returns
 */
export function isValidMustacheSyntax(str: string): boolean {
  str = str.trim();

  return str.startsWith("{{") && str.endsWith("}}");
}
