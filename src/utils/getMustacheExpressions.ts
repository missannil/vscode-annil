export function getMustacheValue(content: string): string {
  return content.trim().slice(2, -2).trim();
}

export function getMustacheExpressions(content: string): string[] {
  const mustacheValueList = content.match(/{{(.*?)}}/g) ?? [];

  return mustacheValueList.map((mustacheValue) => {
    return mustacheValue.slice(2, -2).trim();
  });
}

/**
 * 获取所有的大胡子语法中的变量 外部的不包含
 * 1. `{{bool}}` | `{{ bool }}` => `bool`
 * 2. `aaa_{{bool}}_{{ aaa === bbb }} xxx ` => [`bool`, `aaa`, `bbb`]
 */
export function getMustacheValueList(content: string): string[] {
  const mustacheValueList = content.match(/{{(.*?)}}/g);
  if (mustacheValueList === null) return [];
  const results: string[] = [];
  mustacheValueList.forEach((mustacheValue) => {
    // 找到mustacheValues中的所有变量
    const variableList = mustacheValue.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g);
    variableList?.forEach((variable) => {
      results.push(variable);
    });
  });

  return results;
}

// console.log(getMustacheValueList("aaa_{{bool}}_{{ aaa === bbb }} xxx "));
// console.log(getMustacheValue("111{{item > index ? 123 : 333 :333 }}   {{ ddd }}"));
