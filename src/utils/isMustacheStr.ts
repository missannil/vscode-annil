export function isMustacheStr(str: string): boolean {
  str = str.trim();

  return str.startsWith("{{") && str.endsWith("}}");
}

// export function includesMustache(str: string): boolean {
//   const openIndex = str.indexOf("{{");
//   const closeIndex = str.indexOf("}}");

//   return openIndex !== -1 && closeIndex !== -1 && openIndex < closeIndex;
// }

/**
 * 字符串语法是否有效
 * (如果存在至少一个 {{...}}，并且不存在非法的 { 或 }，则字符串是合法的)
 * ```ts
 * // console.log(isValidString("{{aaa}}")); // 输出：true
 * // console.log(isValidString("{{aaa}} {{bbb}}")); // 输出：true
 * // console.log(isValidString("{{aaa}} bbb {{ccc}}")); // 输出：true
 * // console.log(isValidString("{{aaa}")); // 输出：false
 * // console.log(isValidString("{aaa}}")); // 输出：false
 * // console.log(isValidString("aaa {{bbb}} ccc")); // 输出：true
 * // console.log(isValidString("aaa {{bbb} ccc")); // 输出：false
 * // console.log(isValidString("aaa {bbb} ccc")); // 输出：false
 * // console.log(isValidString("aaa bbb ccc")); // 输出：false
 * ```
 */
export function isValidSyntax(str: string): boolean {
  // 检查是否存在至少一个 {{...}}
  const validMustacheRegex = /{{.*?}}/g;
  const hasValidMustache = validMustacheRegex.test(str);

  // 移除所有的 {{...}}
  const strWithoutValidMustache = str.replace(validMustacheRegex, "");

  // 检查是否存在非法的 { 或 }
  const invalidBracesRegex = /[{}]/;
  const hasInvalidBraces = invalidBracesRegex.test(strWithoutValidMustache);

  // 如果存在至少一个 {{...}}，并且不存在非法的 { 或 }，则字符串是合法的
  return hasValidMustache && !hasInvalidBraces;
}
