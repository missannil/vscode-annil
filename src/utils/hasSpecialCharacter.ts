/**
 * 是否含有特殊字符(`. `, `>` ,`<` , `===`, `!==`, `>=`, `<=`, `!=`, `==`,`&&`, `||`, `!`,`+`, `-`, `*`, `/`, `%`, `^`, `&`, `|`, `~`, `?`,`:`)
 */
export function hasSpecialCharacter(rawAttrValue: string): boolean {
  const specialCharacterPattern = /(\.|[<>]|[<>]=|!==|===|!=|==|&&|\|\||[!+\-*/%^&|~]|[?:])/;

  return specialCharacterPattern.test(rawAttrValue);
}
