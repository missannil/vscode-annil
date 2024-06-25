/**
 * 1. `{{bool}}` | `{{ bool }}` => `bool`
 * 2. `aaa_{{bool}}_{{ aaa }} ` => [`bool`, `aaa`]
 */
export function getMustacheValue(value: string): string {
  const temp = value.trim().slice(2, -2);

  // 空串不处理,只有空格的字符串不处理,其他的去掉首尾空格
  return temp === "" ? "" : temp.trim() === "" ? temp : temp.trim();
}

/**
 * 1. `{{bool}}` | `{{ bool }}` => `bool`
 * 2. `aaa_{{bool}}_{{ aaa }} ` => [`bool`, `aaa`]
 */
export function getMustacheValueList(value: string): string[] {
  const matches = value.match(/{{.*?}}/g);
  if (!matches) {
    throw new Error("Invalid mustache syntax");
  }

  const results = matches.map(match => {
    const temp = match.slice(2, -2);

    return temp === "" ? "" : temp.trim() === "" ? temp : temp.trim();
  });

  return results;
}
